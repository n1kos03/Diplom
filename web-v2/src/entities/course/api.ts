import { apiInstance } from "shared/api";
import type { 
    ICourse, 
    ICreateCourseData, 
    IUpdateCourseData, 
    ICourseResponse,
    ISection,
    ICreateSectionData,
    IUpdateSectionData,
    ISectionResponse,
    ICourseMaterial,
    ICreateMaterialData,
    IMaterialResponse,
    ISubscription,
    ISubscriptionResponse,
    ICourseTask,
    ICreateTaskData,
    ITaskResponse,
    IUserAnswer,
    ICreateAnswerData,
    IAnswerResponse,
    ITaskReview,
    ICreateReviewData,
    IReviewResponse
} from "./model/types";

export const courseRepository = () => {
    return {
        getAllCourses(): Promise<ICourse[]> {
            return apiInstance.get("/courses");
        },

        getCourseById(id: number): Promise<ICourse> {
            return apiInstance.get(`/courses/${id}`);
        },

        getCoursesByTitle(title: string): Promise<ICourse[]> {
            return apiInstance.get("/courses", { params: { title } });
        },

        createCourse(courseData: ICreateCourseData): Promise<ICourseResponse> {
            return apiInstance.post("/course-creation", courseData);
        },

        updateCourse(id: number, courseData: IUpdateCourseData): Promise<ICourseResponse> {
            return apiInstance.put(`/courses/${id}`, null, { params: courseData });
        },

        getSections(courseId: number): Promise<ISection[]> {
            return apiInstance.get(`/sections/${courseId}`);
        },

        createSection(courseId: number, sectionData: ICreateSectionData): Promise<ISectionResponse> {
            return apiInstance.post(`/sections/${courseId}`, sectionData);
        },

        updateSection(sectionId: number, sectionData: IUpdateSectionData): Promise<ISectionResponse> {
            return apiInstance.put(`/sections/${sectionId}`, sectionData);
        },

        deleteSection(sectionId: number): Promise<ISectionResponse> {
            return apiInstance.post(`/sections/${sectionId}/delete`);
        },

        getMaterials(courseId: number): Promise<ICourseMaterial[]> {
            return apiInstance.get(`/courses/${courseId}/materials`);
        },

        uploadMaterial(courseId: number, sectionId: number, materialData: ICreateMaterialData): Promise<IMaterialResponse> {
            const formData = new FormData();
            formData.append('file', materialData.file);
            formData.append('description', materialData.description);
            formData.append('order_number', materialData.order_number.toString());

            return apiInstance.post(`/courses/${courseId}/materials-upload/${sectionId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        },

        updateMaterial(courseId: number, sectionId: number, materialId: number, description: string, orderNumber: number): Promise<IMaterialResponse> {
            const formData = new FormData();
            formData.append('description', description);
            formData.append('order_number', orderNumber.toString());

            return apiInstance.put(`/courses/${courseId}/materials/${sectionId}/${materialId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        },

        deleteMaterial(materialId: number): Promise<IMaterialResponse> {
            return apiInstance.post(`/courses/materials/${materialId}/delete`);
        },

        // Subscription methods
        getSubscriptions(): Promise<ISubscription[]> {
            return apiInstance.get("/subscriptions");
        },

        subscribeToCourse(courseId: number): Promise<ISubscriptionResponse> {
            return apiInstance.post("/subscriptions", { course_id: courseId });
        },

        unsubscribeFromCourse(courseId: number): Promise<ISubscriptionResponse> {
            return apiInstance.post(`/subscriptions/delete`, { course_id: courseId });
        },

        // Course Tasks methods
        getTasks(courseId: number): Promise<ICourseTask[]> {
            return apiInstance.get(`/courses/${courseId}/tasks`);
        },

        uploadTask(courseId: number, sectionId: number, taskData: ICreateTaskData): Promise<ITaskResponse> {
            const formData = new FormData();
            formData.append('file', taskData.file);
            formData.append('description', taskData.description);
            formData.append('order_number', taskData.order_number.toString());

            return apiInstance.post(`/courses/${courseId}/tasks-upload/${sectionId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        },

        updateTask(courseId: number, sectionId: number, taskId: number, description: string, orderNumber: number): Promise<ITaskResponse> {
            const formData = new FormData();
            formData.append('description', description);
            formData.append('order_number', orderNumber.toString());

            return apiInstance.put(`/courses/${courseId}/tasks/${sectionId}/${taskId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        },

        deleteTask(taskId: number): Promise<ITaskResponse> {
            return apiInstance.post(`/courses/tasks/${taskId}/delete`);
        },

        // User Answers methods
        getAnswers(taskId: number): Promise<IUserAnswer[]> {
            return apiInstance.get(`/courses/answers/${taskId}`);
        },

        uploadAnswer(courseId: number, taskId: number, answerData: ICreateAnswerData): Promise<IAnswerResponse> {
            const formData = new FormData();
            formData.append('file', answerData.file);

            return apiInstance.post(`/courses/${courseId}/answers/${taskId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        },

        deleteAnswer(answerId: number): Promise<IAnswerResponse> {
            return apiInstance.post(`/courses/answers/${answerId}/delete`);
        },

        // Task Reviews methods
        getReview(answerId: number): Promise<ITaskReview> {
            return apiInstance.get(`/task_reviews/${answerId}`);
        },

        createReview(answerId: number, reviewData: ICreateReviewData): Promise<IReviewResponse> {
            return apiInstance.post(`/task_reviews/${answerId}`, reviewData);
        },

        deleteReview(reviewId: number): Promise<IReviewResponse> {
            return apiInstance.post(`/task_reviews/${reviewId}/delete`);
        }
    }
}
