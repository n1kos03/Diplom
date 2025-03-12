package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"Diplom/pkg/database"
	"Diplom/pkg/models"
)

func MainRoute(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "There would be main page of web site")
}

func GETUsersHandler(w http.ResponseWriter, r *http.Request) {
	URLQuery := r.URL.Query()
	id := URLQuery.Get("id")
	nickname := URLQuery.Get("nickname")

	switch {
	case id != "":
			GETUserByID(w, id)	
	case nickname != "":
			GETUserByNickname(w, nickname)
		default:
			GETUsers(w, r)
	}
}

func GETUsers(w http.ResponseWriter, r *http.Request) {
	if database.DB == nil {
		log.Println("Database not connected")
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

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

func GETUserByID(w http.ResponseWriter, idStr string) {
	id, err := strconv.Atoi(idStr)
	if err != nil {
		log.Println("Error converting ID to int: ", err)
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

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

func GETUserByNickname(w http.ResponseWriter, nickname string) {
	query := `SELECT "ID","Nickname", "Email", "Password", "Bio", "Created_at" FROM "User" WHERE "Nickname" = $1`

	row, err := database.DB.Query(query, nickname)
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

// TODO: Add validation and encryption of password
func  POSTRegisterUser(w http.ResponseWriter, r *http.Request) {
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

	query := `INSERT INTO "User" ("Nickname", "Email", "Password") VALUES ($1, $2, $3) RETURNING "ID"`
	
	var userID int
	err = database.DB.QueryRow(query, user.Nickname, user.Email, user.Password).Scan(&userID)
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