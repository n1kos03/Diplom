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

// GETSubscriptionsHandler retrieves all subscriptions from the database and returns them as a JSON response.
//
// The handler queries the database for all subscriptions and returns them as a JSON response.
// If successful, it returns a JSON response with the following fields for each subscription:
// - UserID: the ID of the user who subscribed to the course
// - CourseID: the ID of the course to which the user subscribed
// - CreatedAt: the timestamp when the user subscribed to the course
//
// If an error occurs during data retrieval or processing, it responds with an appropriate HTTP error status.
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

func GETSubscriptionsByUserIDHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	userID, err := strconv.Atoi(ps.ByName("user_id"))
	if err != nil {
		http.Error(w, "Error converting user ID to int", http.StatusInternalServerError)
		log.Println("Error converting user ID to int: ", err)
		return
	}

	rows, err := database.DB.Query(`SELECT * FROM "Subscriptions" WHERE "User_id" = $1`, userID)
	if err != nil {
		http.Error(w, "Error getting data", http.StatusInternalServerError)
		log.Println("Error getting data: ", err)
		return
	}

	var subscriptions []models.Subscription

	for rows.Next() {
		var subscription models.Subscription

		err := rows.Scan(&subscription.UserID, &subscription.CourseID, &subscription.CreatedAt)
		if err != nil {
			http.Error(w, "Error scanning data", http.StatusInternalServerError)
			log.Println("Error scanning data: ", err)
			return
		}

		subscriptions = append(subscriptions, subscription)
	}

	if err = rows.Err(); err !=nil {
		http.Error(w, "Error iterating over rows", http.StatusInternalServerError)
		log.Println("Error iterating over rows: ", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	json.NewEncoder(w).Encode(subscriptions)
}

// POSTSubscriptionHandler creates a new subscription.
//
// The handler expects the course ID as a form value from the request body.
// It authenticates the user and inserts the subscription into the database.
// If successful, it returns a JSON response with the following fields:
// - message: a string with the message "Subscription created"
// - user_id: the ID of the user who subscribed to the course
// - course_id: the ID of the course to which the user subscribed
//
// If an error occurs during data retrieval or processing, it responds with an appropriate HTTP error status.
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

// DELETESubscriptionHandler deletes a subscription.
//
// The handler expects the course ID as a parameter in the request body.
// It checks if the request is a DELETE request and if the user is authorized.
// If successful, it deletes the subscription from the database and returns a JSON response with the following fields:
// - message: a string with the message "Subscription deleted"
// - user_id: the ID of the user who unsubscribed from the course
// - course_id: the ID of the course from which the user unsubscribed
//
// If an error occurs during data retrieval or processing, it responds with an appropriate HTTP error status.
func DELETESubscriptionHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
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
	
	courseID, err := strconv.Atoi(ps.ByName("course_id"))
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