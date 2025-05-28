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
	"strings"

	"github.com/julienschmidt/httprouter"
	"github.com/minio/minio-go/v7"
)

// GETUserPhotoHandler retrieves all user photos for a given user and returns them as a JSON response.
//
// The handler expects the user ID as a parameter in the URL path.
// If successful, it returns a JSON response with the following fields for each user photo:
// - ID: the ID of the photo
// - UserID: the ID of the user who uploaded the photo
// - ContentURL: the URL of the photo content
// - UploadedAt: the timestamp when the photo was uploaded
//
// If an error occurs during data retrieval or processing, it responds with an appropriate HTTP error status.
func GETUserPhotoHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")

	rows, err := database.DB.Query(`SELECT * FROM "User_photos" WHERE "User_id" = $1`, id)
	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	var userPhotos []models.UserPhoto

	for rows.Next() {
		var userPhoto models.UserPhoto

		err := rows.Scan(&userPhoto.ID, &userPhoto.UserID, &userPhoto.ContentURL, &userPhoto.UploadedAt)
		if err != nil {
			http.Error(w, "Error scanning data", http.StatusInternalServerError)
			return
		}

		userPhotos = append(userPhotos, userPhoto)
	}

	if err = rows.Err(); err != nil {
		http.Error(w, "Error iterating over rows", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	json.NewEncoder(w).Encode(userPhotos)
}

// POSTUserPhotoHandler creates a new user photo and uploads a file to the object storage.
//
// The handler expects the following parameter in the URL path:
// - id: the ID of the user
//
// The handler expects a file to be uploaded in the request body, which is inserted into the database and uploaded to the object storage.
// If successful, it returns a JSON response with the following fields:
// - message: a message indicating that the file was uploaded successfully
// - user_id: the ID of the user who uploaded the photo
// - content_url: the URL of the uploaded file
//
// If an error occurs during data retrieval or processing, it responds with an appropriate HTTP error status.
func POSTUserPhotoHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	err := r.ParseMultipartForm(50 << 20)
	if err != nil {
		http.Error(w, "File too large", http.StatusInternalServerError)
		return
	}

	userID := ps.ByName("id")

	file, handler, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Error getting file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	bucketName := objStor.FormatBucketName(ps.ByName("id"), 1)
	
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

// DELETEUserPhotoHandler deletes a user photo.
//
// The handler expects the photo ID as a parameter in the URL path.
// It retrieves the content URL of the photo, removes the associated object from the storage,
// and deletes the record from the database.
//
// If successful, it returns a JSON response with the following fields:
// - message: a message indicating that the photo was deleted successfully
// - id: the ID of the deleted photo
// - content_url: the URL of the deleted photo
//
// If an error occurs during data retrieval or processing, it responds with an appropriate HTTP error status.
func DELETEUserPhotoHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	photoID := ps.ByName("id")

	var contentURL string
	err := database.DB.QueryRow(`SELECT "Content_url" FROM "User_photos" WHERE "id" = $1`, photoID).Scan(&contentURL)
	if err != nil {
		http.Error(w, "Error getting data while deleting", http.StatusInternalServerError)
		log.Println("Error getting data while deleting: ", err)
		return
	}

	contentURLNamesPart := strings.TrimPrefix(contentURL, "http://localhost:9000/")

	bucketNameObjectName := strings.Split(contentURLNamesPart, "/")

	err = objStor.MinioClient.RemoveObject(context.Background(), bucketNameObjectName[0], bucketNameObjectName[1], minio.RemoveObjectOptions{})
	if err != nil {
		http.Error(w, "Error removing object", http.StatusInternalServerError)
		return
	}

	_, err = database.DB.Exec(`DELETE FROM "User_photos" WHERE "id" = $1`, photoID)
	if err != nil {
		http.Error(w, "Error deleting data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Photo deleted successfully",
		"id": photoID,
		"content_url": contentURL,
	})
}