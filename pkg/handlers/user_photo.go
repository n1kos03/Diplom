package handlers

import (
	"Diplom/pkg/database"
	objStor "Diplom/pkg/obj_storage"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/minio/minio-go/v7"
)

func POSTUserPhotoHandler(w http.ResponseWriter, r *http.Request) {
	err := r.ParseMultipartForm(50 << 20)
	if err != nil {
		http.Error(w, "File too large", http.StatusInternalServerError)
		return
	}

	userID, err := strconv.Atoi(r.FormValue("user_id"))
	if err != nil {
		http.Error(w, "Error converting user ID to int", http.StatusInternalServerError)
		return
	}

	file, handler, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Error getting file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	var userName string

	err = database.DB.QueryRow(`SELECT "Nickname" FROM "User" WHERE "ID" = $1`, userID).Scan(&userName)
	if err != nil {
		http.Error(w, "Error getting user name", http.StatusNotFound)
		return
	}

	bucketName := objStor.FormatBucketName(userName, 1)
	
	err = objStor.CreateBucketIfNotExists(objStor.MinioClient, bucketName)
	if err != nil {
		http.Error(w, "Error creating bucket", http.StatusInternalServerError)
		log.Println("Error creating bucket: ", err)
		return
	}

	fileName := objStor.FormatObjectName(bucketName, handler.Filename)

	uploadInfo, err := objStor.MinioClient.PutObject(context.Background(), bucketName, fileName, file, -1, minio.PutObjectOptions{})
	if err != nil {
		http.Error(w, "Error uploading file", http.StatusInternalServerError)
		log.Println("Error uploading file: ", err)
		return
	}

	fileURL := fmt.Sprintf("http://localhost:9000/%s/%s", bucketName, uploadInfo.Key)

	log.Println("File uploaded successfully. Location: ", uploadInfo.Location)

	_, err = database.DB.Exec(`INSERT INTO "User_photos" ("User_id", "Content_url") VALUES ($1, $2)`, userID, fileURL)
	if err != nil {
		http.Error(w, "Error inserting data", http.StatusInternalServerError)
		log.Println("Error inserting data: ", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "file uploaded",
		"user_id": userID,
		"content_url": fileURL,
	})
}