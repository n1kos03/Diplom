export interface ICourseRating {
    id: number;
    course_id: number;
    user_id: number;
    rating: number;
    created_at: string;
}

export interface ICreateRatingData {
    rating: number;
}

export interface IUpdateRatingData {
    rating: number;
}

export interface IRatingResponse {
    message: string;
    id: number;
    rating?: number;
    previousRating?: number;
    newRating?: number;
}
