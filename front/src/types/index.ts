export interface User {
  id: number;
  nickname: string;
  email: string;
  bio: string;
  created_at: string;
}

export interface Photo {
  id: string;
  userId: string;
  url: string;
  title: string;
  createdAt: string;
}

export interface Course {
  id: number;
  author_id: number;
  author_name: string;
  title: string;
  description: string;
  created_at: string;
}

export interface CourseMaterial {
  id: number;
  course_id: string;
  // title: string;
  content_url: string;
  description: string;
  // fileType: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  userId: string;
  courseId: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (userData: LoginData) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  // bio?: string;
}

export interface LoginData {
  email: string;
  password: string;
}