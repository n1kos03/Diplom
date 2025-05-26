import { apiInstance } from "shared/api";
import type { 
    ICourseRating,
    ICreateRatingData,
    IUpdateRatingData,
    IRatingResponse
} from "./model/types";

export const ratingRepository = () => {
    return {
        getAllRatings(): Promise<ICourseRating[]> {
            return apiInstance.get("/courses_rating");
        },

        createRating(courseId: number, ratingData: ICreateRatingData): Promise<IRatingResponse> {
            return apiInstance.post(`/courses_rating/${courseId}`, ratingData);
        },

        updateRating(courseId: number, ratingData: IUpdateRatingData): Promise<IRatingResponse> {
            return apiInstance.put(`/courses_rating/${courseId}`, ratingData);
        },

        deleteRating(courseId: number): Promise<IRatingResponse> {
            return apiInstance.remove(`/courses_rating/${courseId}`);
        }
    }
}