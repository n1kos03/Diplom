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

func GETSubscriptionsHandler( w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	rows, err := database.DB.Query(`SELECT * FROM "Subscriptions" ORDER BY "User_id" ASC`)
	if err != nil {
		http.Error(w, "Error getting data", http.StatusInternalServerError)
		return
	}

	var subscriptions []models.Subscription

	for rows.Next() {
		var subscription models.Subscription

		err := rows.Scan(&subscription.UserID, &subscription.CourseID, &subscription.CreatedAt)
		if err != nil {
			http.Error(w, "Error scanning data", http.StatusInternalServerError)
			return
		}

		subscriptions = append(subscriptions, subscription)
	}

	if err = rows.Err(); err !=nil {
		http.Error(w, "Error iterating over rows", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(subscriptions)
}

func POSTSubscriptionHandler(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid method", http.StatusMethodNotAllowed)
		return
	}
	
	claims, err := auth.GetTokenClaimsFromRequest(r)
	if err != nil || claims == nil {
		http.Error(w, "Error getting claims", http.StatusUnauthorized)
		log.Println("Error getting claims: ", err)
		return
	}
	
	userIDRow := claims["user"].(map[string]interface{})["id"].(float64)

	userID := int(userIDRow)

	courseID, err := strconv.Atoi(r.FormValue("course_id"))
	if err != nil {
		log.Println("Error converting user ID to int: ", err)
		http.Error(w, "Error converting course ID to int", http.StatusInternalServerError)
		return
	}

	_, err = database.DB.Exec(`INSERT INTO "Subscriptions" ("User_id", "Course_id") VALUES ($1, $2)`, userID, courseID)
	if err != nil {
		http.Error(w, "Error inserting data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Subscription created",
		"user_id": userID,
		"course_id": courseID,
	})
}

func DELETESubscriptionHandler(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Invalid method", http.StatusMethodNotAllowed)
		return
	}
	
	claims, err := auth.GetTokenClaimsFromRequest(r)
	if err != nil || claims == nil {
		http.Error(w, "Error getting claims", http.StatusUnauthorized)
		log.Println("Error getting claims: ", err)
		return
	}
	
	userIDRow := claims["user"].(map[string]interface{})["id"].(float64)

	userID := int(userIDRow)
	
	courseID, err := strconv.Atoi(r.FormValue("course_id"))
	if err != nil {
		http.Error(w, "Error converting data to int", http.StatusInternalServerError)
		return
	}

	_, err = database.DB.Exec(`DELETE FROM "Subscriptions" WHERE "User_id" = $1 AND "Course_id" = $2`, userID, courseID)
	if err != nil {
		http.Error(w, "Error deleting data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Subscription deleted",
		"user_id": userID,
		"course_id": courseID,
	})
}