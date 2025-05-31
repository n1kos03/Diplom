import { apiInstance } from "shared/api";
import { API_URL } from "shared/api/base";
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
            return apiInstance.remove(`/sections/${sectionId}`);
        },

        getMaterials(courseId: number): Promise<ICourseMaterial[]> {
            return apiInstance.get(`/courses/${courseId}/materials`);
        },

        uploadMaterial(courseId: number, sectionId: number, materialData: ICreateMaterialData): Promise<IMaterialResponse> {
            const formData = new FormData();
            formData.append('file', materialData.file);
            formData.append('title', materialData.title);
            formData.append('description', materialData.description);
            formData.append('order_number', materialData.order_number.toString());

            return fetch(`${API_URL}/courses/${courseId}/materials-upload/${sectionId}/`, {
                method: 'POST',
                body: formData,
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            }).then(res => res.json());
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

        deleteMaterial(courseId: number, sectionId: number, materialId: number): Promise<IMaterialResponse> {
            return apiInstance.remove(`/courses/${courseId}/materials/${sectionId}/${materialId}/`);
        },

        // Subscription methods
        getSubscriptions(): Promise<ISubscription[]> {
            return apiInstance.get("/subscriptions");
        },

        getSubscribersCount(courseId: number): Promise<number> {
            return apiInstance.get("/subscriptions").then(subscriptions => {
                if (!subscriptions) return 0;
                return (subscriptions as ISubscription[]).filter(s => s.course_id === courseId).length;
            });
        },

        subscribeToCourse(courseId: number): Promise<ISubscriptionResponse> {
            const formData = new FormData();
            formData.append('course_id', courseId.toString());
            return apiInstance.post("/subscriptions", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        },

        unsubscribeFromCourse(courseId: number): Promise<ISubscriptionResponse> {
            const formData = new FormData();
            formData.append('course_id', courseId.toString());
            return apiInstance.remove(`/subscriptions`, {
                data: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        },

        // Course Tasks methods
        getTasks(courseId: number): Promise<ICourseTask[]> {
            return apiInstance.get(`/courses/${courseId}/tasks`);
        },

        uploadTask(courseId: number, sectionId: number, taskData: ICreateTaskData): Promise<ITaskResponse> {
            const formData = new FormData();
            formData.append('file', taskData.file);
            formData.append('title', taskData.title);
            formData.append('description', taskData.description);
            formData.append('order_number', taskData.order_number.toString());

            return fetch(`${API_URL}/courses/${courseId}/tasks-upload/${sectionId}/`, {
                method: 'POST',
                body: formData,
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            }).then(res => res.json());
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

        deleteTask(courseId: number, sectionId: number, taskId: number): Promise<ITaskResponse> {
            return apiInstance.remove(`/courses/${courseId}/tasks/${sectionId}/${taskId}/`);
        },

        // User Answers methods
        getAnswers(taskId: number): Promise<IUserAnswer[]> {
            // Получаем courseId из URL текущей страницы
            const courseId = window.location.pathname.split('/')[2];
            return apiInstance.get<IUserAnswer[]>(`/courses/${courseId}/answers/${taskId}`).then(answers => {
                // Получаем текущего пользователя
                const userStr = localStorage.getItem('user');
                if (!userStr) return answers;

                try {
                    const userData = JSON.parse(userStr);
                    const currentUser = userData.user;

                    // Если у нас есть информация о курсе, проверяем является ли пользователь автором
                    const courseStr = localStorage.getItem(`course_${courseId}`);
                    if (courseStr) {
                        const courseData = JSON.parse(courseStr);
                        // Если пользователь автор курса, возвращаем все ответы
                        if (courseData.author_id === currentUser.id) {
                            return answers;
                        }
                    }

                    // Если пользователь не автор или информация о курсе недоступна,
                    // возвращаем только ответы текущего пользователя
                    return answers.filter(answer => answer.user_id === currentUser.id);
                } catch (e) {
                    console.error('Error parsing user data:', e);
                    return answers;
                }
            });
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

        deleteAnswer(courseId: number, taskId: number, answerId: number): Promise<IAnswerResponse> {
            return apiInstance.remove(`/courses/${courseId}/answers/${taskId}/${answerId}`);
        },

        // Task Reviews methods
        getReview(answerId: number): Promise<ITaskReview | null> {
            if (!answerId) return Promise.resolve(null);
            return apiInstance.get<ITaskReview>(`/task_reviews/${answerId}`);
        },

        createReview(answerId: number, reviewData: ICreateReviewData): Promise<IReviewResponse> {
            return apiInstance.post<IReviewResponse>(`/task_reviews/${answerId}`, reviewData);
        },

        updateReview(answerId: number, reviewId: number, reviewData: ICreateReviewData): Promise<IReviewResponse> {
            return apiInstance.put<IReviewResponse>(`/task_reviews/${answerId}/${reviewId}`, reviewData);
        },

        deleteReview(answerId: number, reviewId: number): Promise<IReviewResponse> {
            return apiInstance.remove<IReviewResponse>(`/task_reviews/${answerId}/${reviewId}`);
        },

        // Task methods
        getTaskById(taskId: number): Promise<ICourseTask> {
            // Получаем courseId из URL текущей страницы
            const courseId = window.location.pathname.split('/')[2];
            // Получаем задание из списка всех заданий курса
            return apiInstance.get<ICourseTask[]>(`/courses/${courseId}/tasks`).then((tasks) => {
                const task = tasks.find(t => t.id === taskId);
                if (!task) {
                    throw new Error('Task not found');
                }
                return task;
            });
        },

        // Answer methods
        submitAnswer(courseId: number, taskId: number, answerData: ICreateAnswerData): Promise<IAnswerResponse> {
            const formData = new FormData();
            formData.append('file', answerData.file);

            return apiInstance.post(`/courses/${courseId}/answers/${taskId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        },

        getAnswerForTask(taskId: number): Promise<IUserAnswer | null> {
            // Получаем courseId из URL текущей страницы
            const courseId = window.location.pathname.split('/')[2];
            return this.getAnswers(taskId).then(answers => {
                // Возвращаем первый ответ, если он есть
                return answers.length > 0 ? answers[0] : null;
            });
        },

        getReviewForAnswer(answerId: number): Promise<ITaskReview | null> {
            return apiInstance.get(`/task_reviews/${answerId}`);
        }
    }
}
