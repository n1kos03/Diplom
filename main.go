package main

import (
	"log"
	"net/http"

	"Diplom/pkg/database"
	"Diplom/pkg/handlers"
)

func main() {
	// Connect to database
	database.ConnectDB()

	// Close database connection
	defer database.DB.Close()

	if database.DB != nil {
		log.Println("Database connected")
	} else {
		log.Println("Database not connected")
	}

	// Allocate a new mux router to route requests
	mux := http.NewServeMux()
	
	// Handle requests
	mux.HandleFunc("/", handlers.MainRoute)
	mux.HandleFunc("GET /users/", handlers.GETUsersHandler)
	mux.HandleFunc("POST /users/register/", handlers.POSTRegisterUser)
	mux.HandleFunc("PUT /users/", handlers.PUTUser)

	// Start server
	log.Println("Server is running on port 8080")
	err := http.ListenAndServe(":8080", mux)
	if err != nil {
		log.Fatal("Error starting server: ", err)
	}
	log.Println("Server is stopped")
}