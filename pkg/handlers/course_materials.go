package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"Diplom/pkg/database"
	"Diplom/pkg/models"
	objStor "Diplom/pkg/obj_storage"

	"github.com/julienschmidt/httprouter"
	"github.com/minio/minio-go/v7"
)

// GETCourseMaterialsHandler retrieves all materials for a given course and returns them as a JSON response.
//
// The handler expects the following parameters in the URL path:
// - id: the ID of the course
//
// The handler queries the database for materials associated with the specified course ID.
// If successful, it returns a JSON response with the following fields for each material:
// - ID: the material ID
// - CourseID: the ID of the course to which the material belongs
// - ContentURL: the URL of the material content
// - Description: the description of the material
// - CreatedAt: the timestamp when the material was created
// - SectionID: the ID of the section to which the material belongs
//
// If an error occurs during data retrieval or processing, it responds with an appropriate HTTP error status.
func GETCourseMaterialsHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	courseID := ps.ByName("id")

	query := `SELECT * FROM "Course_materials" WHERE "Course_id" = $1`

	rows, err := database.DB.Query(query, courseID)
	if err != nil {
		http.Error(w, "Error getting data", http.StatusInternalServerError)
		return
	}

	var materials []models.CourseMaterials

	for rows.Next() {
		var material models.CourseMaterials

		err := rows.Scan(&material.ID, &material.CourseID, &material.Title, &material.ContentURL, &material.Description, &material.CreatedAt, &material.SectionID, &material.OrderNumber)
		if err != nil {
			http.Error(w, "Error scanning data", http.StatusInternalServerError)
			log.Println("Error scanning data: ", err)
			return
		}

		materials = append(materials, material)
	}

	if err = rows.Err(); err != nil {
		http.Error(w, "Error iterating over rows", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(materials)
}

// POSTCourseMaterialsHandler creates a new course material and uploads a file to the object storage.
//
// The handler expects the following parameters in the URL path:
// - id: the ID of the course
// - section_id: the ID of the section
// - description: the description of the material
// - file: the file to upload
// - order_number: the order number of the material
//
// The handler returns a JSON response with the following fields:
// - message: a message indicating that the file was uploaded successfully
// - url: the URL of the uploaded file
//
// If an error occurs during data retrieval or processing, it responds with an appropriate HTTP error status.
func POSTCourseMaterialsHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
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

	bucketName := objStor.FormatBucketName(ps.ByName("id"), 0)

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

	_, err = database.DB.Exec(`INSERT INTO "Course_materials" ("Course_id", title, "Content_URL", "Description", section_id, order_number) VALUES ($1, $2, $3, $4, $5, $6)`, courseID, title, fileURL, description, sectionID, orderNumber)
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

// PUTCourseMaterialsHandler updates a course material.
//
// The handler expects the following parameters in the URL path:
// - material_id: the ID of the material to update
//
// The handler expects the following parameters in the request body:
// - description: the new description of the material
// - order_number: the new order number of the material
//
// The handler returns a JSON response with the following fields:
// - message: a message indicating that the material was updated successfully
// - id: the ID of the updated material
//
// If an error occurs during data retrieval or processing, it responds with an appropriate HTTP error status.
func PUTCourseMaterialsHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	materialID, err := strconv.Atoi(ps.ByName("material_id"))
	if err != nil {
		http.Error(w, "Error converting material ID to int", http.StatusInternalServerError)
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
		_, err := database.DB.Exec(`UPDATE "Course_materials" SET title = $1 WHERE "ID" = $2`, title, materialID)
		if err != nil {
			http.Error(w, "Error updating data", http.StatusInternalServerError)
			return
		}
	}

	if description != "" {
		_, err := database.DB.Exec(`UPDATE "Course_materials" SET "Description" = $1 WHERE "ID" = $2`, description, materialID)
		if err != nil {
			http.Error(w, "Error updating data", http.StatusInternalServerError)
			return
		}
	}

	if orderNumber != 0 {
		_, err = database.DB.Exec(`UPDATE "Course_materials" SET order_number = $1 WHERE "ID" = $2`, orderNumber, materialID)
		if err != nil {
			http.Error(w, "Error updating data", http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Material updated successfully",
		"id": materialID,
	})
}

// DELETECourseMaterialsHandler deletes a course material.
//
// The handler expects a single parameter:
// - id: the ID of the material to delete
//
// If successful, it returns a JSON response with the following fields:
// - message: a message indicating that the material was deleted successfully
// - id: the ID of the deleted material
// - url: the URL of the deleted material
//
// If an error occurs during data retrieval or processing, it responds with an appropriate HTTP error status.
func DELETECourseMaterialsHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	materialID, err := strconv.Atoi(ps.ByName("material_id"))
	if err != nil {
		http.Error(w, "Error converting course ID to int", http.StatusInternalServerError)
		return
	}

	var contentURL string
	err = database.DB.QueryRow(`SELECT "Content_URL" FROM "Course_materials" WHERE "ID" = $1`, materialID).Scan(&contentURL)
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

	_, err = database.DB.Exec(`DELETE FROM "Course_materials" WHERE "ID" = $1`, materialID)
	if err != nil {
		http.Error(w, "Error deleting data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Material deleted successfully",
		"id": materialID,
		"url": contentURL,
	})
}