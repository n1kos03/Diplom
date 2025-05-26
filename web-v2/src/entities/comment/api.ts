import { apiInstance } from "shared/api";
import type { IComment, ICreateCommentData, ICommentResponse } from "./models/types";

export const commentRepository = () => {
    return {
        getCommentsByCourseId(courseId: number): Promise<IComment[]> {
            return apiInstance.get(`/courses/${courseId}/comments`);
        },

        createComment(courseId: number, commentData: ICreateCommentData): Promise<ICommentResponse> {
            return apiInstance.post(`/courses/${courseId}/comments`, commentData);
        },

        deleteComment(courseId: number): Promise<ICommentResponse> {
            return apiInstance.post(`/courses/${courseId}/comments/delete`);
        }
    }
}
