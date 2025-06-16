import { apiInstance } from "shared/api"
import type { IRegisterUserData, IUser, IUpdateUserData, IUserResponse, IUserPhoto, ICreatePhotoData, IPhotoResponse } from "./model/types";

export const userRepository = () => {
    return {
        getAllUsers(): Promise<IUser[]> {
            return apiInstance.get("/users");
        },

        getUserById(id: number): Promise<IUser> {
            return apiInstance.get(`/users/${id}`);
        },

        getUserByNickname(nickname: string): Promise<IUser[]> {
            return apiInstance.get("/users", { params: { nickname } });
        },

        register(userData: IRegisterUserData): Promise<IUserResponse> {
            return apiInstance.post("/users/registration", userData);
        },

        login(userData: { email: string; password: string }): Promise<IUserResponse> {
            return apiInstance.post("/login", userData);
        },

        updateUser(id: number, userData: IUpdateUserData): Promise<IUserResponse> {
            return apiInstance.put(`/users/${id}`, null, { params: userData });
        },

        deleteUser(id: number): Promise<IUserResponse> {
            return apiInstance.post(`/users/${id}/delete`);
        },

        getUserPhotos(userId: number): Promise<IUserPhoto[]> {
            return apiInstance.get(`/users/${userId}/user_photos`);
        },

        uploadPhoto(userId: number, photoData: ICreatePhotoData): Promise<IPhotoResponse> {
            const formData = new FormData();
            formData.append('file', photoData.file);

            return apiInstance.post(`/users/user_photos/${userId}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        },

        deletePhoto(userId: number, photoId: number): Promise<IPhotoResponse> {
            return apiInstance.remove(`/users/${photoId}/user_photos/`);
        },

        getUserSubscriptions(userId: number): Promise<{ course_id: number }[]> {
            return apiInstance.get(`/subscriptions/${userId}`);
        }
    }
}