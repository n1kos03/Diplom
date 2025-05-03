package auth

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"Diplom/pkg/database"
	"Diplom/pkg/models"

	jwt "github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// First variant
// func generateToken(email string, id int) (string, error) {
// 	claims := jwt.MapClaims{
// 		"id":    id,
// 		"email": email,
// 		"exp":   time.Now().Add(time.Minute * 15).Unix(),
// 	}
// 	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
// 	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
// }

// Second variant
func generateToken(user models.User) (string, error) {
	claims := jwt.MapClaims{
		"user":  map[string]interface{}{
			"id": user.ID,
			"nickname": user.Nickname,
			"email": user.Email,
			"bio": user.Bio,
			"created_at": user.CreatedAt,
		},
		"exp":   time.Now().Add(time.Minute * 15).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid method", http.StatusMethodNotAllowed)
		return
	}

	var user models.User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, "Error decoding data", http.StatusInternalServerError)
		return
	}

	var hashedPassword string
	// var id int
	err = database.DB.QueryRow(`SELECT "ID", "Password", "Nickname", "Bio", "Created_at" FROM "User" WHERE "Email" = $1`, user.Email).Scan(&user.ID, &hashedPassword, &user.Nickname, &user.Bio, &user.CreatedAt)
	if err != nil {
		log.Println(err, "Error while getting data from DB")
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(user.Password))
	if err != nil {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	// token, err := generateToken(user.Email, id)
	token, err := generateToken(user)
	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"token": token,
		"user":  map[string]interface{}{
			"id": user.ID,
			"nickname": user.Nickname,
			"email": user.Email,
			"bio": user.Bio,
			"created_at": user.CreatedAt,
		},
	})
}

// Middleware that checks if the user is authenticated, so
// by this function we can isolate routes that are only for authenticated users
func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authString := r.Header.Get("Authorization")
		if authString == "" {
			log.Println("No token in request")
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
 
		next.ServeHTTP(w, r)
	}
}