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
	Rating float64 `json:"rating"`
	CreatedAt time.Time `json:"created_at"`
}

type CourseMaterials struct {
	ID int `json:"id"`
	CourseID int `json:"course_id"`
	ContentURL string `json:"content_url"`
	Description string `json:"description"`
	CreatedAt time.Time `json:"created_at"`
	SectionID int `json:"section_id"`
	OrderNumber int `json:"order_number"`
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

type CourseRating struct {
	ID int `json:"id"`
	CourseID int `json:"course_id"`
	UserID int `json:"user_id"`
	Rating float64 `json:"rating"`
	CreatedAt time.Time `json:"created_at"`
}

type Section struct {
	ID int `json:"id"`
	CourseID int `json:"course_id"`
	Title string `json:"title"`
	Description string `json:"description"`
}

type CourseTask struct {
	ID int `json:"id"`
	CourseID int `json:"course_id"`
	SectionID int `json:"section_id"`
	OrderNumber int `json:"order_number"`
	ContentURL string `json:"content_url"`
	Description string `json:"description"`
	CreatedAt time.Time `json:"created_at"`
}

type UserAnswer struct {
	ID int `json:"id"`
	TaskID int `json:"task_id"`
	UserID int `json:"user_id"`
	ContentURL string `json:"content_url"`
	CreatedAt time.Time `json:"created_at"`
}

type TaskReview struct {
	ID int `json:"id"`
	AnswerID int `json:"answer_id"`
	Grade int `json:"grade"`
	AuthorComment string `json:"author_comment"`
	CreatedAt time.Time `json:"created_at"`
}