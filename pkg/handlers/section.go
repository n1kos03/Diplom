package handlers

import (
	"Diplom/pkg/database"
	"Diplom/pkg/models"
	"encoding/json"
	"net/http"

	"github.com/julienschmidt/httprouter"
)

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