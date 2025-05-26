package handlers

import (
	"Diplom/pkg/database"
	"Diplom/pkg/models"
	"encoding/json"
	"net/http"

	"github.com/julienschmidt/httprouter"
)

// GETSectionHandler retrieves all sections for a given course and returns them as a JSON response.
//
// The handler expects the following parameter in the URL path:
// - course_id: the ID of the course
//
// If successful, it returns a JSON response with the following fields for each section:
// - ID: the section ID
// - CourseID: the ID of the course to which the section belongs
// - Title: the title of the section
// - Description: the description of the section
//
// If an error occurs during data retrieval or processing, it responds with an appropriate HTTP error status.
func GETSectionHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	courseID := ps.ByName("course_id")

	var sections []models.Section

	rows, err := database.DB.Query("SELECT * FROM section WHERE course_id = $1", courseID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var section models.Section
		err = rows.Scan(&section.ID, &section.CourseID, &section.Title, &section.Description)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		sections = append(sections, section)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	json.NewEncoder(w).Encode(sections)
}

// POSTSectionHandler creates a new section and adds it to the specified course.
//
// The handler expects a valid course ID in the URL path and a JSON body
// containing the section information (title, description).
//
// If successful, it returns a JSON response with the following fields:
// - message: a string with the message "Section created"
// - id: the ID of the newly created section
//
// If the request body is invalid or if an error occurs during data insertion,
// it responds with an appropriate HTTP error status.
func POSTSectionHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	courseID := ps.ByName("course_id")

	var section models.Section
	err := json.NewDecoder(r.Body).Decode(&section)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = database.DB.QueryRow("INSERT INTO section (course_id, title, description) VALUES ($1, $2, $3) RETURNING id", courseID, section.Title, section.Description).Scan(&section.ID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Section created",
		"id": section.ID,
	})
}

// PUTSectionHandler updates a section.
//
// The handler expects the section ID as a parameter in the URL path.
// It updates the section title or description in the database, depending on the presence of the
// "title" or "description" field in the JSON request body. If successful, it returns a JSON response with the
// following fields:
// - message: a string with the message "Section updated"
// - id: the ID of the updated section
//
// If an error occurs during data retrieval or processing, it responds with an appropriate HTTP error status.
func PUTSectionHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	sectionID := ps.ByName("id")

	var section models.Section
	err := json.NewDecoder(r.Body).Decode(&section)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if section.Title != "" {
		_, err = database.DB.Exec("UPDATE section SET title = $1 WHERE id = $2", section.Title, sectionID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	if section.Description != "" {
		_, err = database.DB.Exec("UPDATE section SET description = $1 WHERE id = $2", section.Description, sectionID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Section updated",
		"id": sectionID,
	})
}

// DELETESectionHandler deletes a section.
//
// The handler expects the section ID as a parameter in the URL path.
// If successful, it returns a JSON response with the following fields:
// - message: a string with the message "Section deleted"
// - id: the ID of the deleted section
//
// If an error occurs during data retrieval or processing, it responds with an appropriate HTTP error status.
func DELETESectionHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	sectionID := ps.ByName("id")

	_, err := database.DB.Exec("DELETE FROM section WHERE id = $1", sectionID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Section deleted",
		"id": sectionID,
	})
}