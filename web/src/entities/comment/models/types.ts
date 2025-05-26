export interface IComment {
    id: number;
    course_id: number;
    user_id: number;
    content: string;
    created_at: string;
}

export interface ICreateCommentData {
    content: string;
}

export interface ICommentResponse {
    message: string;
    id: number;
}
