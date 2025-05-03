import api from './api';
import { Course, CourseMaterial } from '../types';

// Get all courses with optional search query
export const getCourses = async (searchQuery?: string): Promise<Course[]> => {
  try {
    const response = await api.get('/courses', {
      params: { title: searchQuery }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch courses');
  }
};

// Get course by ID
export const getCourseById = async (id: string): Promise<Course> => {
  try {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch course');
  }
};

// Create new course
export const createCourse = async (courseData: Partial<Course>): Promise<Course> => {
  try {
    const response = await api.post('/courses/course_creation/', courseData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create course');
  }
};

// Update course
export const updateCourse = async (id: string, courseData: Partial<Course>): Promise<Course> => {
  try {
    const response = await api.put(`/courses/${id}`, courseData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update course');
  }
};

// Delete course


// Get course materials
export const getCourseMaterials = async (courseId: string): Promise<CourseMaterial[]> => {
  try {
    const response = await api.get(`/courses/course_materials/${courseId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch course materials');
  }
};

// Add course material
export const addCourseMaterial = async (courseId: string, file: File): Promise<CourseMaterial> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/courses/course_materials/upload/${courseId}`, formData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to add course material');
  }
};

// Delete course material
export const deleteCourseMaterial = async (id: string): Promise<void> => {
  try {
    await api.delete(`/courses/course_materials/${id}`);
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete course material');
  }
};

// Subscribe to course
export const subscribeToCourse = async (courseId: string, userId: string): Promise<void> => {
  try {
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('courseId', courseId);
    await api.post(`/subscriptions/`, formData);
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to subscribe to course');
  }
};

// Unsubscribe from course
export const unsubscribeFromCourse = async (courseId: string, userId: string): Promise<void> => {
  try {
    await api.delete(`/subscriptions/`, {
      params: {
        courseId,
        userId,
      }
    });
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to unsubscribe from course');
  }
};