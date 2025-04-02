package models

import "time"

type User struct {
	ID int `json:"id"`
	Nickname string `json:"nickname"`
	Email string `json:"email"`
	Password string `json:"password"`
	Bio string `json:"bio"`
	CreatedAt time.Time `json:"created_at"`
}

type Course struct {
	ID int `json:"id"`
	AuthorID int `json:"author_id"`
	Title string `json:"title"`
	Description string `json:"description"`
	CreatedAt time.Time `json:"created_at"`
}

type CourseMaterials struct {
	ID int `json:"id"`
	CourseID int `json:"course_id"`
	ContentURL string `json:"content_url"`
	Description string `json:"description"`
	CreatedAt time.Time `json:"created_at"`
}