import api from './api'
import { LoginData, RegisterData } from '../types';

export const apiLogin = async (loginData: LoginData) => {
  try {
    const response = await api.post('/login/', loginData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Login faild');
  }
};

export const apiRegister = async (registerData: RegisterData) => {
  try {
    const response = await api.post('/users/register/', registerData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Registration failed');
  }
};