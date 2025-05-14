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
	AuthorName string `json:"author_name"`
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

type UserPhoto struct{
	ID int `json:"id"`
	UserID int `json:"user_id"`
	ContentURL string `json:"content_url"`
	UploadedAt time.Time `json:"uploaded_at"`
}

type Subscription struct {
	CourseID int `json:"course_id"`
	UserID int `json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
}

type Comment struct {
	ID int `json:"id"`
	Course_id int `json:"course_id"`
	User_id int `json:"user_id"`
	Content string `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}