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

func GETCourseRatingHandler(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	rows, err := database.DB.Query(`SELECT * FROM course_rating`)
	if err != nil {
		http.Error(w, "Error getting data", http.StatusInternalServerError)
		return
	}

	var courseRatings []models.CourseRating

	for rows.Next() {
		var courseRating models.CourseRating

		err := rows.Scan(&courseRating.ID, &courseRating.CourseID, &courseRating.UserID, &courseRating.Rating, &courseRating.CreatedAt)
		if err != nil {
			http.Error(w, "Error scanning data", http.StatusInternalServerError)
			return
		}

		courseRatings = append(courseRatings, courseRating)
	}

	if err = rows.Err(); err != nil {
		http.Error(w, "Error iterating over rows", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(courseRatings)
}

func POSTCourseRatingHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid method", http.StatusMethodNotAllowed)
		return
	}

	claims, err := auth.GetTokenClaimsFromRequest(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var courseRating models.CourseRating

	err = json.NewDecoder(r.Body).Decode(&courseRating)
	if err != nil {
		http.Error(w, "Error decoding data", http.StatusInternalServerError)
		log.Println("Error decoding data: ", err)
		return
	}

	courseRating.UserID = int(claims["user"].(map[string]interface{})["id"].(float64))
	
	courseID := ps.ByName("id")
	courseRating.CourseID, err = strconv.Atoi(courseID)
	if err != nil {
		http.Error(w, "Invalid course id", http.StatusBadRequest)
		return
	}

	err = database.DB.QueryRow(`INSERT INTO course_rating (course_id, user_id, rating) VALUES ($1, $2, $3) RETURNING id`, courseRating.CourseID, courseRating.UserID, courseRating.Rating).Scan(&courseRating.ID)
	if err != nil {
		http.Error(w, "Error inserting data", http.StatusInternalServerError)
		log.Println("Error inserting data: ", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Rating created",
		"id": courseRating.ID,
		"rating": courseRating.Rating,
	})
}

func PUTCourseRatingHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	if r.Method != http.MethodPut {
		http.Error(w, "Invalid method", http.StatusMethodNotAllowed)
		return
	}

	cliams, err := auth.GetTokenClaimsFromRequest(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var courseRating models.CourseRating

	err = json.NewDecoder(r.Body).Decode(&courseRating)
	if err != nil {
		http.Error(w, "Error decoding data", http.StatusInternalServerError)
		log.Println("Error decoding data: ", err)
		return
	}

	courseRating.UserID = int(cliams["user"].(map[string]interface{})["id"].(float64))
	
	courseID := ps.ByName("id")
	courseRating.CourseID, err = strconv.Atoi(courseID)
	if err != nil {
		http.Error(w, "Invalid course id", http.StatusBadRequest)
		return
	}

	row, err := database.DB.Query(`SELECT rating FROM course_rating WHERE course_id = $1 AND user_id = $2`, courseRating.CourseID, courseRating.UserID)
	if err != nil {
		http.Error(w, "Error getting data", http.StatusInternalServerError)
		return
	}

	var previousRating float64
	if row.Next() {
		err = row.Scan(&previousRating)
		if err != nil {
			http.Error(w, "Error scanning data", http.StatusInternalServerError)
			return
		}
	}

	_, err = database.DB.Exec(`UPDATE course_rating SET rating = $1 WHERE course_id = $2 AND user_id = $3`, courseRating.Rating, courseID, courseRating.UserID)
	if err != nil {
		http.Error(w, "Error updating data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Rating updated",
		"previousRating": previousRating,
		"newRating": courseRating.Rating,
	})
}

func DELETECourseRatingHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Invalid method", http.StatusMethodNotAllowed)
		return
	}

	claims, err := auth.GetTokenClaimsFromRequest(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var courseRating models.CourseRating

	courseRating.UserID = int(claims["user"].(map[string]interface{})["id"].(float64))
	courseRating.CourseID, err = strconv.Atoi(ps.ByName("id"))
	if err != nil {
		http.Error(w, "Invalid course id", http.StatusBadRequest)
		return
	}


	var deletedRatingID int
	err = database.DB.QueryRow(`DELETE FROM course_rating WHERE course_id = $1 AND user_id = $2 RETURNING id`, courseRating.CourseID, courseRating.UserID).Scan(&deletedRatingID)
	if err != nil {
		http.Error(w, "Error deleting data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Rating deleted",
		"id": deletedRatingID,
	})
}