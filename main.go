package main

import (
	"log"
	"net/http"

	"Diplom/pkg/auth"
	"Diplom/pkg/database"
	"Diplom/pkg/handlers"
	objStor "Diplom/pkg/obj_storage"

	"github.com/joho/godotenv"
	"github.com/julienschmidt/httprouter"
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
	// mux := http.NewServeMux()

	router := httprouter.New()

	router.POST("/login/", auth.LoginHandler)

	router.GET("/courses/:id/comments/", handlers.GETCommentsHandler)
	router.POST("/courses/:id/comments/", handlers.POSTCommentHandler)
	router.DELETE("/courses/:id/comments/:comment_id/", handlers.DELETECommentHandler)

	router.GET("/courses/:id/materials/", handlers.GETCourseMaterialsHandler)
	router.POST("/courses/:id/materials-upload/:section_id/", handlers.POSTCourseMaterialsHandler)
	router.PUT("/courses/:id/materials/:section_id/:material_id/", handlers.PUTCourseMaterialsHandler)
	router.DELETE("/courses/:id/materials/:section_id/:material_id/", handlers.DELETECourseMaterialsHandler)

	router.GET("/courses/:id/tasks/", handlers.GETCourseTasksHandler)
	router.POST("/courses/:id/tasks-upload/:section_id/", handlers.POSTCourseTasksHandler)
	router.PUT("/courses/:id/tasks/:section_id/:task_id/", handlers.PUTCourseTasksHandler)
	router.DELETE("/courses/:id/tasks/:section_id/:task_id/", handlers.DELETECourseTasksHandler)

	router.GET("/courses/", handlers.GETCoursesHandler)
	router.GET("/courses/:id/", handlers.GETCourseByID)
	router.POST("/course-creation/", handlers.POSTCourseHandler)
	router.PUT("/courses/:id/", handlers.PUTCourse)
	
	router.GET("/subscriptions/", handlers.GETSubscriptionsHandler)
	router.GET("/subscriptions/:user_id/", handlers.GETSubscriptionsByUserIDHandler)
	router.POST("/subscriptions/", handlers.POSTSubscriptionHandler)
	router.DELETE("/subscriptions/:course_id/", handlers.DELETESubscriptionHandler)

	router.GET("/users/", handlers.GETUsersHandler)
	router.GET("/users/:id/", handlers.GETUserByID)
	router.POST("/users/registration/", handlers.POSTRegisterUser)
	router.PUT("/users/:id/", handlers.PUTUser)
	router.DELETE("/users/:id/", handlers.DELETEUserHandler)

	router.GET("/users/:id/user_photos/", handlers.GETUserPhotoHandler)
	router.POST("/users/user_photos/:id/upload/", handlers.POSTUserPhotoHandler)
	router.DELETE("/users/:id/user_photos/", handlers.DELETEUserPhotoHandler)

	router.GET("/courses_rating/", handlers.GETCourseRatingHandler)
	router.POST("/courses_rating/:id/", handlers.POSTCourseRatingHandler)
	router.PUT("/courses_rating/:id/", handlers.PUTCourseRatingHandler)
	router.DELETE("/courses_rating/:id/", handlers.DELETECourseRatingHandler)

	router.GET("/sections/:course_id/", handlers.GETSectionHandler)
	router.POST("/sections/:course_id/", handlers.POSTSectionHandler)
	router.PUT("/sections/:id/", handlers.PUTSectionHandler)
	router.DELETE("/sections/:id/", handlers.DELETESectionHandler)

	router.GET("/courses/:id/answers/:task_id/", handlers.GETUserAnswersHandler)
	router.POST("/courses/:id/answers/:task_id/", handlers.POSTUserAnswerHandler)
	router.DELETE("/courses/:id/answers/:task_id/:answer_id/", handlers.DELETEUserAnswerHandler)

	router.GET("/task_reviews/:answer_id/", handlers.GETTaskReviewsHandler)
	router.POST("/task_reviews/:answer_id/", handlers.POSTTaskReviewHandler)
	router.PUT("/task_reviews/:answer_id/:review_id/", handlers.PUTTaskReviewHandler)
	router.DELETE("/task_reviews/:answer_id/:review_id/", handlers.DELETETaskReviewHandler)

	handler := cors.New(cors.Options{
		AllowedOrigins: []string{"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"},
		AllowCredentials: true,
		AllowedHeaders: []string{"Authorization", "Content-Type", "text/plain"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		Debug: true,
	}).Handler(router)

	// Start server
	log.Println("Server is running on port 8080")
	err = http.ListenAndServe(":8080", handler)
	if err != nil {
		log.Fatal("Error starting server: ", err)
	}
	log.Println("Server is stopped")
}