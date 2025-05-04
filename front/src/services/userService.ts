import api from './api';
import { User, Photo, Course, Subscription } from '../types';

// Get user profile
export const getUserProfile = async (id: string): Promise<User> => {
  try {
    const response = await api.get(`/users/${id}`); 
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch user profile');
  }
};

// Update user profile
export const updateUserProfile = async (id: string, userData: Partial<User>): Promise<User> => {
  try {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update user profile');
  }
};

// Get user photos
export const getUserPhotos = async (id: string): Promise<Photo[]> => {
  try {
    const response = await api.get(`/users/user_photos/${id}`); // PREVIOUS VERSION
    // const response = await api.get(`/users/user_photos/`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch user photos');
  }
};

// Upload user photo
export const uploadUserPhoto = async (formData: FormData): Promise<Photo> => {
  try {
    const response = await api.post(`/users/user_photos/upload/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to upload user photo');
  }
};

// Delete user photo
export const deleteUserPhoto = async (id: string): Promise<void> => {
  try {
    await api.delete(`/users/user_photos/${id}`);
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete user photo');
  }
};

// Get user's subscribed courses
export const getUserSubscriptions = async (): Promise<Subscription[]> => {
  try {
    const response = await api.get(`/subscriptions/`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch user subscriptions');
  }
};