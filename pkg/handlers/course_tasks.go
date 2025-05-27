package handlers

import (
	"Diplom/pkg/database"
	"Diplom/pkg/models"
	objStor "Diplom/pkg/obj_storage"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/julienschmidt/httprouter"
	"github.com/minio/minio-go/v7"
)

// GETCourseTasksHandler retrieves all tasks for a given course and returns them as a JSON response.
//
// This handler expects the following parameters in the URL path:
// - id: the ID of the course
//
// The handler queries the database for tasks associated with the specified course ID.
// If successful, it returns a JSON response with the following fields for each task:
// - ID: the task ID
// - CourseID: the ID of the course to which the task belongs
// - SectionID: the ID of the section to which the task belongs
// - ContentURL: the URL of the task content
// - Description: the description of the task
// - CreatedAt: the timestamp when the task was created
//
// If an error occurs during data retrieval or processing, it responds with an appropriate HTTP error status.
func GETCourseTasksHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	courseID := ps.ByName("id")

	query := `SELECT * FROM course_task WHERE course_id = $1` 

	rows, err := database.DB.Query(query, courseID)
	if err != nil {
		http.Error(w, "Error getting data", http.StatusInternalServerError)
		return
	}

	var tasks []models.CourseTask

	for rows.Next() {
		var task models.CourseTask

		err := rows.Scan(&task.ID, &task.CourseID, &task.SectionID, &task.Title, &task.ContentURL, &task.Description, &task.CreatedAt, &task.OrderNumber)
		if err != nil {
			http.Error(w, "Error scanning data", http.StatusInternalServerError)
			log.Println("Error scanning data: ", err)
			return
		}

		tasks = append(tasks, task)
	}

	if err = rows.Err(); err != nil {
		http.Error(w, "Error iterating over rows", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(tasks)
}

// POSTCourseTasksHandler creates a new course task and uploads a file to the object storage.
//
// The handler expects the following parameters:
// - id: the ID of the course
// - section_id: the ID of the section
// - description: the description of the task
// - file: the file to upload
// - order_number: the order number of the task
//
// The handler returns a JSON response with the following fields:
// - message: a message indicating that the file was uploaded successfully
// - url: the URL of the uploaded file
func POSTCourseTasksHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	err := r.ParseMultipartForm(500 << 20)
	if err != nil {
		http.Error(w, "File too large", http.StatusRequestEntityTooLarge)
		return
	}

	// Take parameters and file
	courseID, err :=  strconv.Atoi(ps.ByName("id"))
	if err != nil {
		http.Error(w, "Error converting course ID to int", http.StatusInternalServerError)
		return
	}
	sectionID, err :=  strconv.Atoi(ps.ByName("section_id"))
	if err != nil {
		http.Error(w, "Error converting course ID to int", http.StatusInternalServerError)
		return
	}
	description := r.FormValue("description")
	title := r.FormValue("title")
	orderNumber, err := strconv.Atoi(r.FormValue("order_number"))
	if err != nil {
		http.Error(w, "Error converting order number to int", http.StatusInternalServerError)
		log.Println("Error converting order number to int: ", err)
		return
	}

	file, handler, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Error getting file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	var courseName string
	err = database.DB.QueryRow(`SELECT "Title" FROM "Course" WHERE "ID" = $1`, courseID).Scan(&courseName)
	if err != nil {
		http.Error(w, "Error getting course name", http.StatusNotFound)
		return
	}

	bucketName := objStor.FormatBucketName(courseName, 0)

	err = objStor.CreateBucketIfNotExists(objStor.MinioClient, bucketName)
	if err != nil {
		http.Error(w, "Error creating bucket", http.StatusInternalServerError)
		log.Println("Error creating bucket: ", err)
		return
	}

	objectName := objStor.FormatObjectName(bucketName, handler.Filename) 

	uploadInfo, err := objStor.MinioClient.PutObject(context.Background(), bucketName, objectName, file, -1, minio.PutObjectOptions{})
	if err != nil {
		http.Error(w, "Error uploading file", http.StatusInternalServerError)
		return
	}

	log.Println("File uploaded successfully. Location: ", uploadInfo.Location)

	fileURL := fmt.Sprintf("http://localhost:9000/%s/%s", bucketName, uploadInfo.Key)

	_, err = database.DB.Exec(`INSERT INTO course_task (course_id, section_id, title, content_URL, description, order_number) VALUES ($1, $2, $3, $4, $5, $6)`, courseID, sectionID, title, fileURL, description, orderNumber)  
	if err != nil {
		http.Error(w, "Error inserting data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "File uploaded successfully",
		"url": fileURL,
	})
}

// PUTCourseTasksHandler updates a course task.
//
// The handler expects the following parameters in the URL path:
// - task_id: the ID of the task to update
//
// The handler expects the following parameters in the request body:
// - description: the new description of the task
// - order_number: the new order number of the task
//
// The handler returns a JSON response with the following fields:
// - message: a message indicating that the task was updated successfully
// - id: the ID of the updated task
//
// If an error occurs during data retrieval or processing, it responds with an appropriate HTTP error status.
func PUTCourseTasksHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	taskID, err := strconv.Atoi(ps.ByName("task_id"))
	if err != nil {
		http.Error(w, "Error converting task ID to int", http.StatusInternalServerError)
		return
	}

	description := r.FormValue("description")
	title := r.FormValue("title")
	orderNumber, err := strconv.Atoi(r.FormValue("order_number"))
	if err != nil {
		http.Error(w, "Error converting order number to int", http.StatusInternalServerError)
		log.Println("Error converting order number to int: ", err)
		return
	}

	if title != "" {
		_, err := database.DB.Exec(`UPDATE course_task SET title = $1 WHERE id = $2`, title, taskID)
		if err != nil {
			http.Error(w, "Error updating data", http.StatusInternalServerError)
			return
		}
	}

	if description != "" {
		_, err := database.DB.Exec(`UPDATE course_task SET description = $1 WHERE id = $2`, description, taskID)
		if err != nil {
			http.Error(w, "Error updating data", http.StatusInternalServerError)
			return
		}
	}

	if orderNumber != 0 {
		_, err = database.DB.Exec(`UPDATE course_task SET order_number = $1 WHERE id = $2`, orderNumber, taskID)
		if err != nil {
			http.Error(w, "Error updating data", http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Task updated successfully",
		"id": taskID,
	})
}

// DELETECourseTasksHandler deletes a course task.
//
// The handler expects a single parameter:
// - id: the ID of the task to delete
//
// If successful, it returns a JSON response with the following fields:
// - message: a message indicating that the material was deleted successfully
// - id: the ID of the deleted task
// - url: the URL of the deleted task
//
// If an error occurs during data retrieval or processing, it responds with an appropriate HTTP error status.
func DELETECourseTasksHandler(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	taskID, err := strconv.Atoi(r.FormValue("id"))
	if err != nil {
		http.Error(w, "Error converting course ID to int", http.StatusInternalServerError)
		return
	}

	var contentURL string
	err = database.DB.QueryRow(`SELECT content_url FROM course_task WHERE id = $1`, taskID).Scan(&contentURL)
	if err != nil {
		http.Error(w, "Error getting data while deleting", http.StatusInternalServerError)
		return
	}

	contentURLNamesPart := strings.TrimPrefix(contentURL, "http://localhost:9000/")
	bucketNameObjectName := strings.Split(contentURLNamesPart, "/")

	err = objStor.MinioClient.RemoveObject(context.Background(), bucketNameObjectName[0], bucketNameObjectName[1], minio.RemoveObjectOptions{})
	if err != nil {
		http.Error(w, "Error removing object", http.StatusInternalServerError)
		return
	}

	_, err = database.DB.Exec(`DELETE FROM course_task WHERE id = $1`, taskID)
	if err != nil {
		http.Error(w, "Error deleting data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Material deleted successfully",
		"id": taskID,
		"url": contentURL,
	})
}