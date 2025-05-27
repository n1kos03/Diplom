/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const createApiInstance = () => {
    const axiosInstance: AxiosInstance = axios.create({
        baseURL: `${API_URL}/`,
        timeout: 120000,
        headers: {
            'Content-Type': 'application/json',
        },
        withCredentials: true
    });

    axiosInstance.interceptors.request.use(
        (config) => {
            const accessToken = localStorage.getItem('access_token');
            if (accessToken) {
                config.headers.Authorization = `Bearer ${accessToken}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    const get = async <T>(endpoint: string, options: AxiosRequestConfig = {}): Promise<T> => {
        const response: AxiosResponse<T> = await axiosInstance.get<T>(endpoint, options);
        return response.data;
    }

    const post = async <T, D = unknown>(endpoint: string, data?: D, options: AxiosRequestConfig = {}): Promise<T> => {
        const response: AxiosResponse<T> = await axiosInstance.post<T>(endpoint, data, options);
        return response.data;
    }

    const put = async <T, D = unknown>(endpoint: string, data?: D, options: AxiosRequestConfig = {}): Promise<T> => {
        const response: AxiosResponse<T> = await axiosInstance.put<T>(endpoint, data, options);
        return response.data;
    }

    const patch = async <T, D = unknown>(endpoint: string, data?: D, options: AxiosRequestConfig = {}): Promise<T> => {
        const response: AxiosResponse<T> = await axiosInstance.patch<T>(endpoint, data, options);
        return response.data;
    }

    const remove = async <T>(endpoint: string, options: AxiosRequestConfig = {}): Promise<T> => {
        const response: AxiosResponse<T> = await axiosInstance.delete<T>(endpoint, options);
        return response.data;
    }

    return { get, post, put, patch, remove };
}

export const apiInstance = createApiInstance();