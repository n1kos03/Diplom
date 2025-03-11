package database

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
)

const (
	dbHost = "localhost"
	dbPort = "5432"
	dbUser = "postgres"
	dbPass = "password"
	dbName = "db_diplom"
)

var DB *sql.DB

func ConnectDB() {
	// Create a new database connection string
	// psqlConnInfo := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", dbHost, dbPort, dbUser, dbPass, dbName)
	psqlConnInfo := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable", dbUser, dbPass, dbHost, dbPort, dbName)

	// Open database connection
	var err error
	DB, err = sql.Open("postgres", psqlConnInfo)
	if err != nil {
		log.Fatal("Error connecting to database: ", err)
	}
	
	if DB != nil {
		log.Println("Database connected")
	} else {
		log.Println("Database not connected")
	}

	// Ping database to check if connection is established
	err = DB.Ping()
	if err != nil {
		log.Fatal("Error pinging database: ", err)
	}
}