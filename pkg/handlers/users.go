package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	"Diplom/pkg/database"
	"Diplom/pkg/models"

	"github.com/julienschmidt/httprouter"
	"golang.org/x/crypto/bcrypt"
)

// GETUsersHandler is an HTTP handler for the "/users" endpoint. It retrieves
// either a single user by nickname, if the "nickname" query parameter is
// present, or all users, if the parameter is not present.
//
// The request must be a GET request.
//
// The handler responds with a JSON array of User objects, or an appropriate
// HTTP error status if an error occurs during data retrieval or processing.
func GETUsersHandler(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	URLQuery := r.URL.Query()
	nickname := URLQuery.Get("nickname")

	switch {	
	case nickname != "":
			GETUserByNickname(w, nickname)
		default:
			GETUsers(w, r)
	}
}

// GETUsers retrieves all users from the database and returns them as a JSON response.
//
// This handler does not expect any URL query parameters.
//
// If successful, it returns a JSON response with the following fields for each user:
// - ID: the user ID
// - Nickname: the user's nickname
// - Email: the user's email
// - Password: the user's hashed password
// - Bio: the user's bio
// - CreatedAt: the timestamp when the user was created
//
// If an error occurs during data retrieval or processing, it responds with an appropriate HTTP error status.
func GETUsers(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query(`SELECT "ID","Nickname", "Email", "Password", "Bio", "Created_at" FROM "User" ORDER BY "ID" ASC`)  
	if err != nil {
		log.Println("Error getting users: ", err)
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	var users []models.User

	for rows.Next() {
		var user models.User

		err := rows.Scan(&user.ID, &user.Nickname, &user.Email, &user.Password, &user.Bio, &user.CreatedAt)
		if err != nil {
			log.Println("Error scaning row: ", err)
			http.Error(w, "Error scaning data", http.StatusInternalServerError)
			return
		}

		users = append(users, user)
	}

	if err = rows.Err(); err != nil {
		log.Println("Error iteration over rows: ", err)
		http.Error(w, "Error getting data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	
	j, err := json.Marshal(users)
	if err != nil {
		log.Println("Error marshaling data: ", err)
		http.Error(w, "Error marshaling data", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write(j)
}

// GETUserByID retrieves a user by its ID and returns it as a JSON response.
//
// The handler expects the user ID as a parameter in the URL path.
// If a user is found, it returns a JSON response with the following fields:
// - ID: the user ID
// - Nickname: the user's nickname
// - Email: the user's email
// - Password: the user's hashed password
// - Bio: the user's bio
// - CreatedAt: the timestamp when the user was created
//
// If an error occurs during data retrieval or processing, it responds with an appropriate HTTP error status.
func GETUserByID(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")

	query := `SELECT "ID", "Nickname", "Email", "Password", "Bio", "Created_at" FROM "User" WHERE "ID" = $1`

	row, err := database.DB.Query(query, id)
	if err != nil {
		log.Println("Error getting user: ", err)
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	var user models.User

	if row.Next() {
		err = row.Scan(&user.ID, &user.Nickname, &user.Email, &user.Password, &user.Bio, &user.CreatedAt)
		if err != nil {
			log.Println("Error scanning row: ", err)
			http.Error(w, "Error scanning data", http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	json.NewEncoder(w).Encode(user)
}

// GETUserByNickname retrieves a user by its nickname and returns it as a JSON response.
//
// The handler expects the nickname as a parameter.
// If a user is found, it returns a JSON response with the following fields:
// - ID: the user ID
// - Nickname: the user's nickname
// - Email: the user's email
// - Password: the user's hashed password
// - Bio: the user's bio
// - CreatedAt: the timestamp when the user was created
//
// If an error occurs during data retrieval or processing, it responds with an appropriate HTTP error status.
func GETUserByNickname(w http.ResponseWriter, nickname string) {
	query := `SELECT "ID","Nickname", "Email", "Password", "Bio", "Created_at" FROM "User" WHERE "Nickname" = $1`

	row, err := database.DB.Query(query, nickname)
	if err != nil {
		log.Println("Error getting user: ", err)
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	var users []models.User

	for row.Next() {
		var user models.User

		err = row.Scan(&user.ID, &user.Nickname, &user.Email, &user.Password, &user.Bio, &user.CreatedAt)
		if err != nil {
			log.Println("Error scanning row: ", err)
			http.Error(w, "Error scanning data", http.StatusInternalServerError)
			return
		}

		users = append(users, user)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	json.NewEncoder(w).Encode(users)
}

// POSTRegisterUser is an HTTP handler for the "/users" endpoint. It creates a new user in the database.
//
// The handler expects the user information as a JSON object in the request body. The expected fields are:
// - Nickname: the nickname for the user
// - Email: the email address for the user
// - Password: the password for the user
// - Bio: the bio for the user
//
// The handler responds with a JSON response with the following fields:
// - message: a string with the message "User created"
// - id: the ID of the newly created user
//
// If an error occurs during data retrieval or processing, it responds with an appropriate HTTP error status.
func  POSTRegisterUser(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid method", http.StatusMethodNotAllowed)
		return
	}

	var user models.User

	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		log.Println("Error decoding data: ", err)
		http.Error(w, "Error decoding data", http.StatusInternalServerError)
		return
	}

	var userID int

	err = database.DB.QueryRow(`SELECT "ID" FROM "User" WHERE "Email" = $1`, user.Email).Scan(&userID)
	if err != nil && err != sql.ErrNoRows {
		log.Println("Error getting user ID: ", err)
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}
	if userID != 0 {
		http.Error(w, "User with this email already exists", http.StatusBadRequest)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Println("Error hashing password: ", err)
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	query := `INSERT INTO "User" ("Nickname", "Email", "Password", "Bio") VALUES ($1, $2, $3, $4) RETURNING "ID"`
	
	err = database.DB.QueryRow(query, user.Nickname, user.Email, string(hashedPassword), user.Bio).Scan(&userID)
	if err != nil {
		log.Println("Error inserting user: ", err)
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"messge": "User created",
		"id": userID,
	})
}

// PUTUser updates a user's nickname and/or bio.
//
// The handler expects the user ID as a parameter in the URL path.
// It updates the user's nickname or bio in the database, based on the presence of
// the "nickname" or "bio" query string parameter. If successful, it returns a JSON response with the
// following fields:
// - message: a string with the message "nickname updated" or "bio updated"
// - id: the ID of the updated user
// - nickname: the new nickname of the user, if the nickname was updated
// - bio: the new bio of the user, if the bio was updated
//
// If an error occurs during data retrieval or processing, it responds with an appropriate HTTP error status.
func PUTUser(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	if r.Method != http.MethodPut {
		http.Error(w, "Invalid method", http.StatusMethodNotAllowed)
		return
	}

	URLQuery := r.URL.Query()
	nickname := URLQuery.Get("nickname")
	bio := URLQuery.Get("bio")

	id := ps.ByName("id")

	if nickname != "" {
		query := `UPDATE "User" SET "Nickname" = $1 WHERE "ID" = $2`
		_, err := database.DB.Exec(query, nickname, id)
		if err != nil {
			log.Println("Error updating user: ", err)
			http.Error(w, "Server error", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "nickname updated",
			"id": id,
			"nickname": nickname,
		})
	}

	if bio != "" {
		query := `UPDATE "User" SET "Bio" = $1 WHERE "ID" = $2`
		_, err := database.DB.Exec(query, bio, id)
		if err != nil {
			log.Println("Error updating user: ", err)
			http.Error(w, "Server error", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "bio updated",
			"id": id,
			"bio": bio,
		})
	}
}

// DELETEUserHandler deletes a user by ID.
//
// The handler expects the user ID as a parameter in the URL path.
// It deletes the associated record from the database.
//
// If successful, it returns a JSON response with the following fields:
// - message: a message indicating that the user was deleted successfully
// - id: the ID of the deleted user
//
// If an error occurs during data retrieval or processing, it responds with an appropriate HTTP error status.
func DELETEUserHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Invalid method", http.StatusMethodNotAllowed)
		return
	}

	id := ps.ByName("id")

	_, err := database.DB.Exec(`DELETE FROM "User" WHERE "ID" = $1`, id)
	if err != nil {
		log.Println("Error deleting user: ", err)
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "user deleted",
		"id": id,
	})
}