import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/common/Button'
import Alert from '../components/common/Alert'
import { useAuth } from '../context/AuthContext'
import { Lock, Mail } from 'lucide-react'

const Login: React.FC = () => {
  const { login, isLoading, error, clearError } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const validateForm = () => {
    clearError();
    setFormError(null);

    if (!email) {
      setFormError('Email is required');
      return false;
    }

    if (!password) {
      setFormError('Password is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await login({ email, password });
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8">
        <div className="text-center mb-8">
          <Link to="/" className="text-indigo-600 text-3xl font-bold">ArtCourse</Link>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Sign in to your account</h2>
          <p className="mt-2 text-gray-600">
            Or{' '}
            <Link to="/users/register/" className="text-indigo-600 hover:text-indigo-800 font-medium"> 
              create a new account
            </Link>
          </p>
        </div>
        
        {(error || formError) && (
          <Alert
            type="error"
            message={error || formError || ''}
            onClose={() => {
              clearError();
              setFormError(null);
            }}
          />
        )}

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Mail size={18} />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              {/* <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-800">
                Forgot your password?
              </Link> */}
            </div>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Lock size={18} />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="••••••••"
              />
            </div>
          </div>
            
            <div>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={isLoading}
              >
                Sign in
              </Button>
            </div>
        </form>

        <div className="mt-6">
          <p className="text-center text-sm text-gray-600">
            By singing in, you agree to our {' '}
            <Link to="/terms" className="text-indigo-600 hover:text-indigo-800">
              Terms of Service
            </Link>
            and{' '}
            <Link to="/privacy" className="text-indigo-600 hover:text-indigo-800">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login