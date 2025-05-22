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

	if err = row.Err(); err != nil {
		http.Error(w, "Error iterating over rows", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	json.NewEncoder(w).Encode(task_review)
}

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

func DELETETaskReviewHandler(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	taskReviewID, err := strconv.Atoi(r.FormValue("id"))
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