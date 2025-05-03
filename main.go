package main

import (
	"log"
	"net/http"

	"Diplom/pkg/auth"
	"Diplom/pkg/database"
	"Diplom/pkg/handlers"
	objStor "Diplom/pkg/obj_storage"

	"github.com/joho/godotenv"
	"github.com/rs/cors"
)

func main() {
	err := godotenv.Load("./conf/jwt.env")
	if err != nil {
		log.Fatal("Error loading jwt.env file: ", err)
	}

	err = godotenv.Load("./conf/minio.env")
	if err != nil {
		log.Fatal("Error loading minio.env file: ", err)
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

	// Connect to minio
	objStor.InitMinioClient()

	// Allocate a new mux router to route requests
	mux := http.NewServeMux()
	
	// Handle requests
	// mux.HandleFunc("/", auth.AuthMiddleware(handlers.MainRoute))
	// mux.HandleFunc("/", handlers.MainRoute)

	mux.HandleFunc("POST /login/", auth.LoginHandler)

	mux.HandleFunc("GET /users/", handlers.GETUsersHandler)
	mux.HandleFunc("POST /users/register/", handlers.POSTRegisterUser)
	mux.HandleFunc("PUT /users/", handlers.PUTUser)
	mux.HandleFunc("DELETE /users/", handlers.DELETEUserHandler)

	mux.HandleFunc("GET /courses/", handlers.GETCoursesHandler)
	mux.HandleFunc("POST /courses/course_creation/", auth.AuthMiddleware(handlers.POSTCourseHandler))
	mux.HandleFunc("PUT /courses/", handlers.PUTCOurse)

	mux.HandleFunc("GET /courses/course_materials/", handlers.GETCourseMaterialsHandler)
	mux.HandleFunc("POST /courses/course_materials/upload/", handlers.POSTCourseMaterialsHandler)
	mux.HandleFunc("DELETE /courses/course_materials/", handlers.DELETECourseMaterialsHandler)

	mux.HandleFunc("GET /users/user_photos/", auth.AuthMiddleware(handlers.GETUserPhotoHandler))
	mux.HandleFunc("POST /users/user_photos/upload/", handlers.POSTUserPhotoHandler)
	mux.HandleFunc("DELETE /users/user_photos/", handlers.DELETEUserPhotoHandler)

	mux.HandleFunc("GET /subscriptions/", handlers.GETSubscriptionsHandler)
	mux.HandleFunc("POST /subscriptions/", handlers.POSTSubscriptionHandler)
	mux.HandleFunc("DELETE /subscriptions/", handlers.DELETESubscriptionHandler)

	handler := cors.New(cors.Options{
		AllowedOrigins: []string{"http://localhost:5173", "http://127.0.0.1:5173"},
		AllowCredentials: true,
		AllowedHeaders: []string{"Authorization", "Content-Type", "text/plain"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		Debug: true,
	}).Handler(mux)

	// Start server
	log.Println("Server is running on port 8080")
	err = http.ListenAndServe(":8080", handler)
	if err != nil {
		log.Fatal("Error starting server: ", err)
	}
	log.Println("Server is stopped")
}