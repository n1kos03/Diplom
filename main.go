package main

import (
	"log"
	"net/http"

	"Diplom/pkg/auth"
	"Diplom/pkg/database"
	"Diplom/pkg/handlers"

	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load("./conf/jwt.env")
	if err != nil {
		log.Fatal("Error loading .env file: ", err)
	}

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
	mux.HandleFunc("/", auth.AuthMiddleware(handlers.MainRoute))

	mux.HandleFunc("POST /login/", auth.LoginHandler)

	mux.HandleFunc("GET /users/", handlers.GETUsersHandler)
	mux.HandleFunc("POST /users/register/", handlers.POSTRegisterUser)
	mux.HandleFunc("PUT /users/", handlers.PUTUser)

	mux.HandleFunc("GET /courses/", handlers.GETCoursesHandler)
	mux.HandleFunc("POST /courses/course_creation/", auth.AuthMiddleware(handlers.POSTCourseHandler))

	// Start server
	log.Println("Server is running on port 8080")
	err = http.ListenAndServe(":8080", mux)
	if err != nil {
		log.Fatal("Error starting server: ", err)
	}
	log.Println("Server is stopped")
}