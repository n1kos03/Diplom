package obj_storage

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
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

func FormatBucketName(name string, prefixDef int) string {
	var prefixName string
	if prefixDef == 0 {
		prefixName = "course"
	} else if prefixDef == 1 {
		prefixName = "user"
	}
	bucket := fmt.Sprintf("%s-%s", prefixName, name)
	bucket = strings.ReplaceAll(bucket, " ", "-")
	bucket = strings.ToLower(bucket)
	return bucket
}

func FormatObjectName(bucketName string, objectName string) string {
	ext := filepath.Ext(objectName)
	clearName := strings.TrimSuffix(objectName, ext)

	for count := 1; ; count++ {
		_, err := MinioClient.StatObject(context.Background(), bucketName, objectName, minio.StatObjectOptions{})
		if err != nil {
			if minio.ToErrorResponse(err).Code == "NoSuchKey" {
				return objectName
			}
			return ""
		}
		objectName = fmt.Sprintf("%s(%d)%s", clearName, count, ext)
	}
}