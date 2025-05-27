'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { userRepository } from 'entities/user/api';
import { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export const Auth = () => {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [error, setError] = useState('');

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (confirmPassword) {
      setPasswordError(e.target.value === confirmPassword ? '' : 'Пароли не совпадают');
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    setPasswordError(e.target.value === password ? '' : 'Пароли не совпадают');
  };

  const isFormValid = () => {
    if (isLogin) {
      return email.trim() !== '' && password.trim() !== '';
    } else {
      return (
        username.trim() !== '' &&
        email.trim() !== '' &&
        password.trim() !== '' &&
        password.length >= 8 &&
        confirmPassword.trim() !== '' &&
        password === confirmPassword
      );
    }
  };

  const handleLogin = async () => {
    try {
      const response = await userRepository().login({
        email,
        password
      });
      
      if (response.token) {
        const decodedToken = jwtDecode(response.token);
        localStorage.setItem('access_token', response.token);
        localStorage.setItem('user', JSON.stringify(decodedToken));
        navigate('/');
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        setError(error.response?.data?.message || 'Ошибка при входе');
      } else {
        setError('Произошла неизвестная ошибка');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      await handleLogin();
    } else {
      try {
        await userRepository().register({
          nickname: username,
          email,
          password,
          bio: ''
        });
        handleLogin();
        resetForm();
      } catch (error) {
        if (error instanceof AxiosError) {
          setError(error.response?.data?.message || 'Ошибка при регистрации');
        } else {
          setError('Произошла неизвестная ошибка');
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0f0f0f] overflow-y-auto">
      <div className="min-h-screen flex">
        {/* Left side with gradient background */}
        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-blue-600 rounded-r-3xl">
          {/* Logo */}
          <div className="absolute top-8 left-8 flex items-center gap-2 z-10">
            <h1 className="text-xl font-bold text-white">nikitosik</h1>
          </div>

          {/* Main text */}
          <div className="absolute bottom-24 left-12 right-12 z-10">
            <h2 className="text-5xl font-bold text-white leading-tight">
              Ваши курсы<br />
              Ваш опыт<br />
              Ваш путь
            </h2>
            <p className="text-white/80 mt-6 max-w-md">
              Создавайте свои курсы и делитесь ими с другими пользователями.
            </p>
          </div>

          {/* Background grid pattern */}
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        </div>

        {/* Right side with form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            <h2 className="text-3xl font-bold text-white mb-2">
              {isLogin ? 'Войти в аккаунт' : 'Создать аккаунт'}
            </h2>
            <p className="text-gray-400 mb-8">
              {isLogin ? 'Войдите в свой аккаунт' : 'Введите данные для создания аккаунта'}
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}
              {!isLogin && (
                <div>
                  <label htmlFor="nickname" className="block text-sm font-medium text-gray-400 mb-1">Никнейм</label>
                  <input
                    type="text"
                    id="nickname"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Введите никнейм"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-gray-900"
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Введите email"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-gray-900"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">Пароль</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="••••••••••••••••"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-gray-900 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-400"
                  >
                    {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                  </button>
                </div>
                {!isLogin && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <div className="w-4 h-4 rounded-full border border-gray-700 flex items-center justify-center">
                        {password.length >= 8 && <div className="w-2 h-2 rounded-full bg-blue-600"></div>}
                      </div>
                      <span>Пароль должен быть длиннее 8 символов</span>
                    </div>
                  </div>
                )}
              </div>

              {!isLogin && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400 mb-1">Подтвердите пароль</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={handleConfirmPasswordChange}
                      placeholder="••••••••••••••••"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-gray-900 pr-10"
                    />
                  </div>
                  {passwordError && (
                    <p className="mt-2 text-sm text-red-500">{passwordError}</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={!isFormValid()}
                className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors mt-4 ${isFormValid()
                    ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                    : 'bg-gray-600 cursor-not-allowed'
                  }`}
              >
                {isLogin ? 'Войти' : 'Зарегистрироваться'}
              </button>
            </form>

            <div className="text-center mt-6">
              <p className="text-gray-400">
                {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-blue-600 ml-1 cursor-pointer"
                >
                  {isLogin ? 'Зарегистрироваться' : 'Войти'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 