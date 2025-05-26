package handlers

import (
	"Diplom/pkg/auth"
	"Diplom/pkg/database"
	"Diplom/pkg/models"
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/julienschmidt/httprouter"
)

/*************  ✨ Windsurf Command ⭐  *************/
// GETCommentsHandler retrieves all comments associated with a specific course ID.
// It expects the course ID as a parameter in the URL path.
// The handler queries the database for comments belonging to the specified course,
// and returns them in JSON format. If there is an error during the process, it
// responds with an appropriate HTTP error status.

/*******  8c504e7b-8cb8-4a5a-96cf-b1eaac2e3e31  *******/
func GETCommentsHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	courseID := ps.ByName("id")

	rows, err := database.DB.Query(`SELECT * FROM "Comments" WHERE course_id = $1 ORDER BY id ASC`, courseID)
	if err != nil {
		http.Error(w, "Error getting data", http.StatusInternalServerError)
		return
	}

	var comments []models.Comment

	for rows.Next() {
		var comment models.Comment

		err := rows.Scan(&comment.ID, &comment.Course_id, &comment.User_id, &comment.Content, &comment.CreatedAt)  
		if err != nil {
			http.Error(w, "Error scanning data", http.StatusInternalServerError)
			log.Println("Error scanning data: ", err)
			return
		}

		comments = append(comments, comment)
	}

	if err = rows.Err(); err != nil {
		http.Error(w, "Error iterating over rows", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(comments)
}

// POSTCommentHandler creates a new comment.
//
// The handler expects the course ID as a parameter in the URL path.
// It decodes the comment content from the request body, and inserts it
// into the database. If there is an error during the process, it
// responds with an appropriate HTTP error status.
func POSTCommentHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	var comment models.Comment

	var err error
	comment.Course_id, err = strconv.Atoi(ps.ByName("id"))
	if err != nil {
		http.Error(w, "Error converting course ID to int", http.StatusInternalServerError)
		return
	}

	claims, err := auth.GetTokenClaimsFromRequest(r)
	if err != nil || claims == nil {
		http.Error(w, "Error getting claims", http.StatusUnauthorized)
		log.Println("Error getting claims: ", err)
		return
	}

	userRaw, ok := claims["user"].(map[string]interface{})
	if !ok {
		http.Error(w, "Error converting id to float64", http.StatusInternalServerError)
		return
	}

	idRaw, ok := userRaw["id"].(float64)
	if !ok {
		http.Error(w, "Error converting id to float64", http.StatusInternalServerError)
		return
	}

	comment.User_id = int(idRaw)

	err = json.NewDecoder(r.Body).Decode(&comment)
	if err != nil {
		http.Error(w, "Error decoding data", http.StatusInternalServerError)
		return
	}

	_, err = database.DB.Exec(`INSERT INTO "Comments" (course_id, user_id, content) VALUES ($1, $2, $3)`, comment.Course_id, comment.User_id, comment.Content)
	if err != nil {
		http.Error(w, "Error inserting data", http.StatusInternalServerError)
		log.Println("Error inserting data: ", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Comment created",
		"course_id": comment.Course_id,
		"user_id": comment.User_id,
		"content": comment.Content,
	})
}

// DELETECommentHandler deletes a comment by ID.
//
// The handler expects a query parameter "id" containing the ID of the comment to delete.
//
// It returns a JSON response with the following fields:
// - message: a message indicating that the comment was deleted successfully
// - id: the ID of the deleted comment
func DELETECommentHandler(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	commentID, err := strconv.Atoi(r.URL.Query().Get("id"))
	if err != nil {
		http.Error(w, "Error converting data to int", http.StatusInternalServerError)
		return
	}

	_, err = database.DB.Exec(`DELETE FROM "Comments" WHERE id = $1`, commentID)
	if err != nil {
		http.Error(w, "Error deleting data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Comment deleted",
		"id": commentID,
	})
}