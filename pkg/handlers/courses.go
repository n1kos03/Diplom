package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"

	"Diplom/pkg/database"
	"Diplom/pkg/models"

	"github.com/golang-jwt/jwt/v5"
)

func GETCoursesHandler (w http.ResponseWriter, r *http.Request) {
	URLQuery := r.URL.Query()
	id := URLQuery.Get("id")
	title := URLQuery.Get("title")

	switch {
	case id != "":
		GETCourseByID(w, id)
	case title != "":
		GETCourseByTitle(w, title)
	default:
		GETCourses(w, r)
	}
}

func GETCourses(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query(`SELECT c.*, u."Nickname" FROM "Course" AS c JOIN "User" AS u ON c."Author_id" = u."ID" ORDER BY c."ID" ASC`)
	if err != nil {
		log.Println("Error getting courses: ", err)
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	var courses []models.Course

	for rows.Next() {
		var course models.Course

		err := rows.Scan(&course.ID, &course.AuthorID, &course.Title, &course.Description, &course.CreatedAt, &course.AuthorName)
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

	j, err := json.Marshal(courses)
	if err != nil {
		log.Println("Error marshaling data: ", err)
		http.Error(w, "Error marshaling data", http.StatusInternalServerError)
		return
	}
	w.Write(j)
}

func GETCourseByID(w http.ResponseWriter, idStr string) {
	id, err := strconv.Atoi(idStr)
	if err != nil {
		log.Println("Error converting ID to int: ", err)
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	query := `SELECT c.*, u."Nickname" FROM "Course" AS c JOIN "User" AS u ON c."Author_id" = u."ID" WHERE c."ID" = $1`

	row, err := database.DB.Query(query, id)
	if err != nil {
		log.Println("Error getting course: ", err)
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	var course models.Course

	if row.Next() {
		err = row.Scan(&course.ID, &course.AuthorID, &course.Title, &course.Description, &course.CreatedAt, &course.AuthorName)
		if err != nil {
			log.Println("Error scanning row: ", err)
			http.Error(w, "Error scanning data", http.StatusInternalServerError)
			return
		}
	}
	
	w.Header().Set("COntent-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	json.NewEncoder(w).Encode(course)
}

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

		err := rows.Scan(&course.ID, &course.AuthorID, &course.Title, &course.Description, &course.CreatedAt, &course.AuthorName)
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

func POSTCourseHandler(w http.ResponseWriter, r *http.Request) {
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

	
	err = database.DB.QueryRow(`INSERT INTO "Course" ("Author_id", "Title", "Description") VALUES ($1, $2, $3) RETURNING "ID"`, claims["id"], course.Title, course.Description).Scan(&course.ID)
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

func PUTCOurse(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Invalid method", http.StatusMethodNotAllowed)
		return
	}

	URLQuery := r.URL.Query()
	id := URLQuery.Get("id")
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