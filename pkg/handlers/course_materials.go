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

	"github.com/minio/minio-go/v7"
)

func GETCourseMaterialsHandler(w http.ResponseWriter, r *http.Request) {
	courseID, err := strconv.Atoi(r.FormValue("course_id"))
	if err != nil {
		http.Error(w, "Error converting course ID to int", http.StatusInternalServerError)
		return
	}

	query := `SELECT * FROM "Course_materials" WHERE "Course_id" = $1`

	rows, err := database.DB.Query(query, courseID)
	if err != nil {
		http.Error(w, "Error getting data", http.StatusInternalServerError)
		return
	}

	var materials []models.CourseMaterials

	for rows.Next() {
		var material models.CourseMaterials

		err := rows.Scan(&material.ID, &material.CourseID, &material.ContentURL, &material.Description, &material.CreatedAt)
		if err != nil {
			http.Error(w, "Error scanning data", http.StatusInternalServerError)
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

func POSTCourseMaterialsHandler(w http.ResponseWriter, r *http.Request) {
	err := r.ParseMultipartForm(500 << 20)
	if err != nil {
		http.Error(w, "File too large", http.StatusRequestEntityTooLarge)
		return
	}

	// Take parameters and file
	courseID, err :=  strconv.Atoi(r.FormValue("course_id"))
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

	_, err = database.DB.Exec(`INSERT INTO "Course_materials" ("Course_id", "Content_URL", "Description") VALUES ($1, $2, $3)`, courseID, fileURL, description)
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

func DELETECourseMaterialsHandler(w http.ResponseWriter, r *http.Request) {
	materialID, err := strconv.Atoi(r.FormValue("id"))
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