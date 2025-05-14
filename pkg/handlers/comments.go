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

func GETCommentsHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	// URLParts := strings.Split(r.URL.Path, "/")
	
	// if URLParts[3] == "" {
	// 	http.Error(w, "Invalid URL", http.StatusBadRequest)
	// 	return
	// }
	
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