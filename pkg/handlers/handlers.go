package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"Diplom/pkg/database"
	modules "Diplom/pkg/models"
)

func MainRoute(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "There would be main page of web site")
}

func GetUsers(w http.ResponseWriter, r *http.Request) {
	if database.DB == nil {
		log.Println("Database not connected")
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	rows, err := database.DB.Query(`SELECT "ID","Nickname", "Email", "Password", "Bio", "Created_at" FROM "User"`)  
	if err != nil {
		log.Println("Error getting users: ", err)
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var users []modules.User

	for rows.Next() {
		var user modules.User

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