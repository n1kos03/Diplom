package auth

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"Diplom/pkg/database"
	"Diplom/pkg/models"

	jwt "github.com/golang-jwt/jwt/v5"
	"github.com/julienschmidt/httprouter"
	"golang.org/x/crypto/bcrypt"
)

func generateToken(user models.User) (string, error) {
	claims := jwt.MapClaims{
		"user": map[string]interface{}{
			"id": user.ID,
			"nickname": user.Nickname,
			"email": user.Email,
			"bio": user.Bio,
			"created_at": user.CreatedAt,
		},
		"exp":   time.Now().Add(time.Minute * 15).Unix(),
		"iat": 	 time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}

func GetTokenClaimsFromRequest(r *http.Request) (jwt.MapClaims, error) {
	authHeader := r.Header.Get("Authorization")

	if authHeader == "" {
		return nil, errors.New("no authorization header found")
	}

	tokenString := strings.TrimPrefix(authHeader, "Bearer ")

	claims := jwt.MapClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("JWT_SECRET")), nil
	})
	if err != nil || !token.Valid {
		return nil, err
	}

	fmt.Printf("Claims: %v (type: %T)\n", claims, claims)
	fmt.Printf("user field type: %T\n", claims["id"])

	return claims, nil
}

func LoginHandler(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
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

	token, err := generateToken(user)
	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"token": token,
		"id": user.ID,
		"nickname": user.Nickname,
		"email": user.Email,
		"bio": user.Bio,
		"created_at": user.CreatedAt,
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