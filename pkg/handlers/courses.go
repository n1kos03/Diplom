package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"Diplom/pkg/database"
	"Diplom/pkg/models"
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
	rows, err := database.DB.Query(`SELECT * FROM "Course" ORDER BY "ID" ASC`)
	if err != nil {
		log.Println("Error getting users: ", err)
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	var courses []models.Course

	for rows.Next() {
		var course models.Course

		err := rows.Scan(&course.ID, &course.AuthorID, &course.Title, &course.Description, &course.CreatedAt)
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

	w.Header().Set("COntent-Type", "application/json")
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

	query := `SELECT * FROM "Course" WHERE "ID" = $1`

	row, err := database.DB.Query(query, id)
	if err != nil {
		log.Println("Error getting course: ", err)
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	var course models.Course

	if row.Next() {
		err = row.Scan(&course.ID, &course.AuthorID, &course.Title, &course.Description, &course.CreatedAt)
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
	query := `SELECT * FROM "Course" WHERE "Title" = $1`

	rows, err := database.DB.Query(query, title)
	if err != nil {
		log.Println("Error getting course: ", err)
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	var courses []models.Course

	for rows.Next() {
		var course models.Course

		err := rows.Scan(&course.ID, &course.AuthorID, &course.Title, &course.Description, &course.CreatedAt)
		if err != nil {
			log.Println("Error scaning row: ", err)
			http.Error(w, "Error scaning data", http.StatusInternalServerError)
			return
		}

		courses = append(courses, course)
	}

	w.Header().Set("COntent-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	json.NewEncoder(w).Encode(courses)
}