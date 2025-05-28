package handlers

import (
	"Diplom/pkg/auth"
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

// GETUserAnswersHandler retrieves all user answers for a given task and returns them as a JSON response.
//
// The handler expects the following parameter in the URL path:
// - task_id: the ID of the task
//
// If successful, it returns a JSON response with the following fields for each answer:
// - ID: the answer ID
// - TaskID: the ID of the task for which the answer was submitted
// - UserID: the ID of the user who submitted the answer
// - ContentURL: the URL of the answer content
// - CreatedAt: the timestamp when the answer was submitted
//
// If an error occurs during data retrieval or processing, it responds with an appropriate HTTP error status.
func GETUserAnswersHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	taskID := ps.ByName("task_id")

	query := `SELECT * FROM user_answer WHERE task_id = $1`

	rows, err := database.DB.Query(query, taskID)
	if err != nil {
		http.Error(w, "Error getting data", http.StatusInternalServerError)
		return
	}

	var answers []models.UserAnswer

	for rows.Next() {
		var answer models.UserAnswer

		err := rows.Scan(&answer.ID, &answer.TaskID, &answer.UserID, &answer.ContentURL, &answer.CreatedAt)
		if err != nil {
			http.Error(w, "Error scanning data", http.StatusInternalServerError)
			log.Println("Error scanning data: ", err)
			return
		}

		answers = append(answers, answer)
	}

	if err = rows.Err(); err != nil {
		http.Error(w, "Error iterating over rows", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(answers)
}

// POSTUserAnswerHandler creates a new user answer and uploads a file to the object storage.
//
// The handler expects the course ID and task ID as parameters in the URL path.
// It authenticates the user and inserts the answer into the database.
// If successful, it returns a JSON response with the following fields:
// - message: a string with the message "File uploaded successfully"
// - url: the URL of the uploaded file
//
// If an error occurs during data retrieval or processing, it responds with an appropriate HTTP error status.
func POSTUserAnswerHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	claims, err := auth.GetTokenClaimsFromRequest(r)
	if err != nil || claims == nil {
		http.Error(w, "Error getting claims", http.StatusUnauthorized)
		log.Println("Error getting claims: ", err)
		return
	}
	
	userID := claims["user"].(map[string]interface{})["id"].(float64)

	err = r.ParseMultipartForm(500 << 20)
	if err != nil {
		http.Error(w, "File too large", http.StatusRequestEntityTooLarge)
		return
	}

	// Take parameters and file
	// courseID, err :=  strconv.Atoi(ps.ByName("id"))
	// if err != nil {
	// 	http.Error(w, "Error converting course ID to int", http.StatusInternalServerError)
	// 	return
	// }
	taskID, err :=  strconv.Atoi(ps.ByName("task_id"))
	if err != nil {
		http.Error(w, "Error converting course ID to int", http.StatusInternalServerError)
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

	_, err = database.DB.Exec(`INSERT INTO user_answer (task_id, user_id, content_url) VALUES ($1, $2, $3)`, taskID, userID, fileURL)
	if err != nil {
		http.Error(w, "Error inserting data", http.StatusInternalServerError)
		log.Println("Error inserting data: ", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "File uploaded successfully",
		"url": fileURL,
	})
}

// DELETEUserAnswerHandler deletes a user answer.
//
// The handler expects a query parameter "id" containing the ID of the answer to delete.
// It retrieves the content URL of the answer, removes the associated object from the storage,
// and deletes the record from the database.
//
// If successful, it returns a JSON response with the following fields:
// - message: a message indicating that the answer was deleted successfully
// - id: the ID of the deleted answer
// - url: the URL of the deleted answer
//
// If an error occurs during data retrieval or processing, it responds with an appropriate HTTP error status.
func DELETEUserAnswerHandler(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	answerID, err := strconv.Atoi(r.FormValue("id"))
	if err != nil {
		http.Error(w, "Error converting course ID to int", http.StatusInternalServerError)
		return
	}

	var contentURL string
	err = database.DB.QueryRow(`SELECT content_url FROM user_answer WHERE id = $1`, answerID).Scan(&contentURL)
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

	_, err = database.DB.Exec(`DELETE FROM user_answer WHERE id = $1`, answerID)
	if err != nil {
		http.Error(w, "Error deleting data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Material deleted successfully",
		"id": answerID,
		"url": contentURL,
	})
}