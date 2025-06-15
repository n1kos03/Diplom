package handlers

import (
	"Diplom/pkg/database"
	"Diplom/pkg/models"
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/julienschmidt/httprouter"
)

// GETTaskReviewsHandler retrieves a task review for a given answer ID and returns it as a JSON response.
//
// This handler expects the following parameter in the URL path:
// - answer_id: the ID of the answer for which the task review is requested
//
// The handler queries the database for the task review associated with the specified answer ID.
// If successful, it returns a JSON response with the following fields:
// - ID: the task review ID
// - AnswerID: the ID of the answer associated with the task review
// - Grade: the grade assigned in the task review
// - AuthorComment: the comment provided by the author in the task review
// - CreatedAt: the timestamp when the task review was created
//
// If an error occurs during data retrieval or processing, it responds with an appropriate HTTP error status.
func GETTaskReviewsHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	answerID := ps.ByName("answer_id")

	var task_review models.TaskReview
	row, err := database.DB.Query(`SELECT * FROM task_reviews WHERE answer_id = $1`, answerID)
	if err != nil {
		http.Error(w, "Error getting data", http.StatusInternalServerError)
		log.Println("Error getting data: ", err)
		return
	}

	if row.Next() {
		err = row.Scan(&task_review.ID, &task_review.AnswerID, &task_review.Grade, &task_review.AuthorComment, &task_review.CreatedAt)
		if err != nil {
			http.Error(w, "Error scanning data", http.StatusInternalServerError)
			log.Println("Error scanning data: ", err)
			return
		}
	}

	defer row.Close()

	if err = row.Err(); err != nil {
		http.Error(w, "Error iterating over rows", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	json.NewEncoder(w).Encode(task_review)
}

// POSTTaskReviewHandler creates a new task review.
//
// The handler expects the following parameter in the URL path:
// - answer_id: the ID of the answer for which the task review is requested
//
// The handler decodes the task review content from the request body (grade, author_comment) and inserts
// it into the database. If successful, it returns a JSON response with the
// following fields:
// - message: a string with the message "Task review created"
// - id: the ID of the newly created task review
//
// If there is an error during data retrieval or processing, it responds with an appropriate HTTP error status.
func POSTTaskReviewHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	var task_review models.TaskReview
	var err error

	task_review.AnswerID, err = strconv.Atoi(ps.ByName("answer_id"))
	if err != nil {
		http.Error(w, "Error converting course ID to int", http.StatusInternalServerError)
		return
	}

	err = json.NewDecoder(r.Body).Decode(&task_review)
	if err != nil {
		http.Error(w, "Error decoding data", http.StatusInternalServerError)
		log.Println("Error decoding data: ", err)
		return
	}

	err = database.DB.QueryRow(`INSERT INTO task_reviews (answer_id, grade, author_comment) VALUES ($1, $2, $3) RETURNING id`, task_review.AnswerID, task_review.Grade, task_review.AuthorComment).Scan(&task_review.ID)
	if err != nil {
		http.Error(w, "Error inserting data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Task review created",
		"id": task_review.ID,
	})
}

func PUTTaskReviewHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	if r.Method != http.MethodPut {
		http.Error(w, "Invalid method", http.StatusMethodNotAllowed)
		return
	}
	
	var task_review models.TaskReview
	var err error

	task_review.AnswerID, err = strconv.Atoi(ps.ByName("answer_id"))
	if err != nil {
		http.Error(w, "Error converting course ID to int", http.StatusInternalServerError)
		return
	}

	task_review.ID, err = strconv.Atoi(ps.ByName("review_id"))
	if err != nil {
		http.Error(w, "Error converting course ID to int", http.StatusInternalServerError)
		return
	}

	err = json.NewDecoder(r.Body).Decode(&task_review)
	if err != nil {
		http.Error(w, "Error decoding data", http.StatusInternalServerError)
		log.Println("Error decoding data: ", err)
		return
	}

	if task_review.Grade != 0 {
		_, err = database.DB.Exec(`UPDATE task_reviews SET grade = $1 WHERE id = $2`, task_review.Grade, task_review.ID)
		if err != nil {
			http.Error(w, "Error updating data", http.StatusInternalServerError)
			return
		}
	}

	if task_review.AuthorComment != "" {
		_, err = database.DB.Exec(`UPDATE task_reviews SET author_comment = $1 WHERE id = $2`, task_review.AuthorComment, task_review.ID)
		if err != nil {
			http.Error(w, "Error updating data", http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Task review updated",
		"id": task_review.ID,
	})
}

// DELETETaskReviewHandler deletes a task review by ID.
//
// The handler expects a single parameter:
// - id: the ID of the task review to delete
//
// If successful, it returns a JSON response with the following fields:
// - message: a message indicating that the task review was deleted successfully
// - id: the ID of the deleted task review
//
// If an error occurs during data retrieval or processing, it responds with an appropriate HTTP error status.
func DELETETaskReviewHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	taskReviewID, err := strconv.Atoi(ps.ByName("review_id"))
	if err != nil {
		http.Error(w, "Error converting course ID to int", http.StatusInternalServerError)
		return
	}

	_, err = database.DB.Exec(`DELETE FROM task_reviews WHERE id = $1`, taskReviewID)
	if err != nil {
		http.Error(w, "Error deleting data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Task review deleted",
		"id": taskReviewID,
	})
}