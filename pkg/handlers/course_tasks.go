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

		err := rows.Scan(&task.ID, &task.CourseID, &task.SectionID, &task.ContentURL, &task.Description, &task.CreatedAt)
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

	_, err = database.DB.Exec(`INSERT INTO course_task (course_id, section_id, content_URL, description) VALUES ($1, $2, $3, $4)`, courseID, sectionID, fileURL, description) 
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