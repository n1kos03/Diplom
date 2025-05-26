package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"

	"Diplom/pkg/database"
	"Diplom/pkg/models"

	"github.com/golang-jwt/jwt/v5"
	"github.com/julienschmidt/httprouter"
)

// GETCoursesHandler handles GET requests to the "/courses" endpoint.
//
// The handler can take an optional "title" query parameter. If the parameter is
// present, it calls GETCourseByTitle to retrieve the course by title. If the
// parameter is not present, it calls GETCourses to retrieve all courses.
//
// The handler is meant to be used as an httprouter.Handle.
func GETCoursesHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	URLQuery := r.URL.Query()
	title := URLQuery.Get("title")

	switch {
	case title != "":
		GETCourseByTitle(w, title)
	default:
		GETCourses(w, r, ps)
	}
}

// GETCourses retrieves all courses from the database and returns them as a JSON response.
//
// The handler expects no URL query parameters.
//
// If successful, it returns a JSON response with the following fields for each course:
// - ID: the course ID
// - AuthorID: the ID of the user who created the course
// - Title: the title of the course
// - Description: the description of the course
// - CreatedAt: the timestamp when the course was created
// - Rating: the rating of the course
// - AuthorName: the nickname of the user who created the course
//
// If an error occurs during data retrieval or processing, it responds with an appropriate HTTP error status.
func GETCourses(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	rows, err := database.DB.Query(`SELECT c.*, u."Nickname" FROM "Course" AS c JOIN "User" AS u ON c."Author_id" = u."ID" ORDER BY c."ID" ASC`)
	if err != nil {
		log.Println("Error getting courses: ", err)
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var courses []models.Course

	for rows.Next() {
		var course models.Course

		err := rows.Scan(&course.ID, &course.AuthorID, &course.Title, &course.Description, &course.CreatedAt, &course.Rating, &course.AuthorName)
		if err != nil {
			log.Println("Error scaning row: ", err)
			http.Error(w, "Error scaning data", http.StatusInternalServerError)
			return
		}

		courses = append(courses, course)
	}

	if err = rows.Err(); err != nil {
		log.Println("Error iteration over rows: ", err)
		http.Error(w, "Error getting data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(courses); err != nil {
		log.Println("Error encoding data: ", err)
		http.Error(w, "Error encoding data", http.StatusInternalServerError)
		return
	}
}

// GETCourseByID retrieves a course by its ID and returns it as a JSON response.
//
// The handler expects the course ID as a parameter in the URL path.
// It queries the database for the course information and the author's nickname.
// If a course is found, it returns a JSON response with the following fields:
// - ID: the course ID
// - AuthorID: the ID of the author of the course
// - Title: the title of the course
// - Description: the description of the course
// - CreatedAt: the timestamp when the course was created
// - Rating: the rating of the course
// - AuthorName: the nickname of the author
//
// If an error occurs during data retrieval or processing, it responds with an appropriate HTTP error status.
func GETCourseByID(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	id := ps.ByName("id")

	query := `SELECT c.*, u."Nickname" FROM "Course" AS c JOIN "User" AS u ON c."Author_id" = u."ID" WHERE c."ID" = $1`

	row, err := database.DB.Query(query, id)
	if err != nil {
		log.Println("Error getting course: ", err)
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	var course models.Course

	if row.Next() {
		err = row.Scan(&course.ID, &course.AuthorID, &course.Title, &course.Description, &course.CreatedAt, &course.Rating, &course.AuthorName)
		if err != nil {
			log.Println("Error scanning row: ", err)
			http.Error(w, "Error scanning data", http.StatusInternalServerError)
			return
		}
	}
	
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	json.NewEncoder(w).Encode(course)
}

// GETCourseByTitle retrieves all courses from the database by title and returns them as a JSON response.
//
// The handler expects the title of the course as a parameter.
//
// If courses are found, it returns a JSON response with the following fields for each course:
// - ID: the course ID
// - AuthorID: the ID of the user who created the course
// - Title: the title of the course
// - Description: the description of the course
// - CreatedAt: the timestamp when the course was created
// - Rating: the rating of the course
// - AuthorName: the nickname of the user who created the course
//
// If an error occurs during data retrieval or processing, it responds with an appropriate HTTP error status.
func GETCourseByTitle(w http.ResponseWriter, title string) {
	query := `SELECT c.*, u."Nickname" FROM "Course" AS c JOIN "User" AS u ON c."Author_id" = u."ID" WHERE c."Title" = $1`

	rows, err := database.DB.Query(query, title)
	if err != nil {
		log.Println("Error getting course: ", err)
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	var courses []models.Course

	for rows.Next() {
		var course models.Course

		err := rows.Scan(&course.ID, &course.AuthorID, &course.Title, &course.Description, &course.CreatedAt, &course.Rating, &course.AuthorName)
		if err != nil {
			log.Println("Error scaning row: ", err)
			http.Error(w, "Error scaning data", http.StatusInternalServerError)
			return
		}

		courses = append(courses, course)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	json.NewEncoder(w).Encode(courses)
}

// POSTCourseHandler creates a new course.
//
// The handler expects a valid JWT token in the "Authorization" header to
// authenticate the user. It decodes the course information from the request
// body (title, description) and inserts it into the database. The handler returns a JSON response
// with the following fields:
// - message: a string with the message "Course created"
// - id: the ID of the newly created course
//
// If the request method is not POST, the token is missing or invalid, or if an
// error occurs during data decoding or insertion, it responds with an
// appropriate HTTP error status.
func POSTCourseHandler(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid method", http.StatusMethodNotAllowed)
		return
	}

	authString := r.Header.Get("Authorization")
	
	if authString == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	tokenString := strings.TrimPrefix(authString, "Bearer ")

	claims := jwt.MapClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("JWT_SECRET")), nil
	})
	if err != nil || !token.Valid {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	var course models.Course
	
	err = json.NewDecoder(r.Body).Decode(&course)
	if err != nil {
		log.Println("Error decoding data: ", err)
		http.Error(w, "Error decoding data", http.StatusInternalServerError)
		return
	}

	
	err = database.DB.QueryRow(`INSERT INTO "Course" ("Author_id", "Title", "Description") VALUES ($1, $2, $3) RETURNING "ID"`, claims["user"].(map[string]interface{})["id"], course.Title, course.Description).Scan(&course.ID)
	if err != nil {
		log.Println("Error inserting course: ", err)
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Course created",
		"id": course.ID,
	})
}

// PUTCourse updates a course.
//
// The handler expects the course ID as a parameter in the URL path.
// It updates the course title or description in the database, depending on the presence of the
// "title" or "description" query string parameter. If successful, it returns a JSON response with the
// following fields:
// - message: a string with the message "title updated" or "description updated"
// - id: the ID of the updated course
// - title: the new title of the course, if the title was updated
// - description: the new description of the course, if the description was updated
//
// If an error occurs during data retrieval or processing, it responds with an appropriate HTTP error status.
func PUTCourse(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	if r.Method != http.MethodPut {
		http.Error(w, "Invalid method", http.StatusMethodNotAllowed)
		log.Println("Invalid method", r.Method)
		return
	}

	URLQuery := r.URL.Query()
	id := ps.ByName("id")
	title := URLQuery.Get("title")
	description := URLQuery.Get("description")

	if title != "" {
		query := `UPDATE "Course" SET "Title" = $1 WHERE "ID" = $2`
		_, err := database.DB.Exec(query, title, id)
		if err != nil {
			log.Println("Error updating course: ", err)
			http.Error(w, "Server error", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "title updated",
			"id": id,
			"title": title,
		})
	}

	if description != "" {
		query := `UPDATE "Course" SET "Description" = $1 WHERE "ID" = $2`
		_, err := database.DB.Exec(query, description, id)
		if err != nil {
			log.Println("Error updating course: ", err)
			http.Error(w, "Server error", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "description updated",
			"id": id,
			"title": description,
		})
	}
}