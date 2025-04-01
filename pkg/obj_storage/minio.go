package obj_storage

import (
	"context"
	"log"
	"os"
	"strings"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

var MinioClient *minio.Client

func InitMinioClient() {
	endpoint := "localhost:9000"
	accessKeyID := os.Getenv("MINIO_ROOT_USER")
	secretAccessKey := os.Getenv("MINIO_ROOT_PASSWORD")
	useSSL := false

	var err error
	MinioClient, err = minio.New(endpoint, &minio.Options{
		Creds: credentials.NewStaticV4(accessKeyID, secretAccessKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		log.Fatal("Error initializing minio client: ", err)
	}

	log.Println("Minio client initialized")
}

func CreateBucketIfNotExists(client *minio.Client, bucketName string) error {
	exists, err := client.BucketExists(context.Background(), bucketName)
	if err != nil {
		return err
	}
	if !exists {
		err = client.MakeBucket(context.Background(), bucketName, minio.MakeBucketOptions{})
		if err != nil {
			return err
		}
		log.Println("Bucket created successfully. Bucket name:  ", bucketName)
	}
	return nil
}

func FormatBucketName(name string) string {
	bucket := strings.ReplaceAll(name, " ", "-")
	bucket = strings.ToLower(bucket)
	return bucket
}