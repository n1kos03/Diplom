export interface ICourse {
    id: number;
    author_id: number;
    author_name: string;
    title: string;
    description: string;
    rating: number;
    created_at: string;
    subscribers_count?: number;
}

export interface ICreateCourseData {
    title: string;
    description: string;
}

export interface IUpdateCourseData {
    title?: string;
    description?: string;
}

export interface ICourseResponse {
    message: string;
    id: number;
    title?: string;
    description?: string;
}

// Section types
export interface ISection {
    id: number;
    course_id: number;
    title: string;
    description: string;
    order_number: number;
}

export interface ICreateSectionData {
    title: string;
    description: string;
    order_number: number;
}

export interface IUpdateSectionData {
    title?: string;
    description?: string;
    order_number?: number;
}

export interface ISectionResponse {
    message: string;
    id: number;
}

// Course Materials types
export interface ICourseMaterial {
    id: number;
    course_id: number;
    title: string;
    content_url: string;
    description: string;
    created_at: string;
    section_id: number;
    order_number: number;
}

export interface ICreateMaterialData {
    title: string;
    description: string;
    file: File;
    order_number: number;
}

export interface IMaterialResponse {
    message: string;
    url: string;
    id?: number;
}

// Subscription types
export interface ISubscription {
    course_id: number;
    user_id: number;
    created_at: string;
}

export interface ISubscriptionResponse {
    message: string;
    course_id: number;
    user_id: number;
}

// Course Task types
export interface ICourseTask {
    id: number;
    course_id: number;
    section_id: number;
    title: string;
    content_url: string;
    description: string;
    created_at: string;
    order_number: number;
}

export interface ICreateTaskData {
    title: string;
    description: string;
    file: File;
    order_number: number;
}

export interface ITaskResponse {
    message: string;
    url: string;
    id?: number;
}

// User Answer types
export interface IUserAnswer {
    id: number;
    task_id: number;
    user_id: number;
    content_url: string;
    created_at: string;
}

export interface ICreateAnswerData {
    file: File;
}

export interface IAnswerResponse {
    message: string;
    url: string;
    id?: number;
}

// Task Review types
export interface ITaskReview {
    id: number;
    answer_id: number;
    grade: number;
    author_comment: string;
    created_at: string;
}

export interface ICreateReviewData {
    grade: number;
    author_comment: string;
}

export interface IReviewResponse {
    message: string;
    id: number;
}
