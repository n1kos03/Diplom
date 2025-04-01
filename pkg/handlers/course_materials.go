package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"Diplom/pkg/database"
	objStor "Diplom/pkg/obj_storage"

	"github.com/minio/minio-go/v7"
)

// func GETCourseMaterialsHandler(w http.ResponseWriter, r *http.Request) {

// }

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

	objectName := handler.Filename
	bucketName := objStor.FormatBucketName(courseName)

	err = objStor.CreateBucketIfNotExists(objStor.MinioClient, bucketName)
	if err != nil {
		http.Error(w, "Error creating bucket", http.StatusInternalServerError)
		log.Println("Error creating bucket: ", err)
		return
	}

	uploadInfo, err := objStor.MinioClient.PutObject(context.Background(), bucketName, objectName, file, -1, minio.PutObjectOptions{})
	if err != nil {
		http.Error(w, "Error uploading file", http.StatusInternalServerError)
		return
	}

	fileURL := fmt.Sprintf("http://localhost:9000/%s/%s", bucketName, uploadInfo.Key)

	log.Println("File uploaded successfully:", fileURL)

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