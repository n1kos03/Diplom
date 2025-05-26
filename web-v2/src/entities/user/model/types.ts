export interface IUser {
    id: number;
    nickname: string;
    email: string;
    password: string;
    bio: string;
    created_at: string;
}

export interface IRegisterUserData {
    nickname: string;
    email: string;
    password: string;
    bio: string;
}

export interface IUpdateUserData {
    nickname?: string;
    bio?: string;
}

export interface IUserResponse {
    message: string;
    id: number;
    nickname?: string;
    bio?: string;
}

export interface IUserPhoto {
    id: number;
    user_id: number;
    content_url: string;
    uploaded_at: string;
}

export interface ICreatePhotoData {
    file: File;
}

export interface IPhotoResponse {
    message: string;
    user_id: number;
    content_url: string;
}