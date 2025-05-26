import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Search, User, Menu, X } from 'lucide-react';

interface NavbarProps {
  onSearch?: (query: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onSearch }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white shadow-md px-4 py-3 sticky top-0 z-50">
      <div className="max-w-7x1 mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-indigo-600 font-bold text-2x1 flex items-center">
          <span className="hidden sm:inline">ArtCourse</span>
          <span className="sm:hidden">AC</span>
        </Link>

        {/* Search Bar - Desktop */}
        {/* <div className="hidden md:block flex-1 max-w-x1 mx-4">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search courses..."
              className="w-full py-2 px-4 pr-10 rounded-full border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <Search size={18} className="text-gray-500" />
            </button>
          </form>
        </div> */}

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <Link
              to="/courses/course_creation/"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition duration-300"
              >
                Create Course
              </Link>
              <div className="relative group">
                <Link to={`/users/${user?.id}`} className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <User size={20} className="text-indigo-600" />
                  </div>
                </Link>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                  <Link
                    to={`/users/${user?.id}`}
                    className="block px-4 py-2 text-gray-800 hover:bg-indigo-50"
                  >
                    My Profile
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-indigo-50"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login/"
                className="text-indigo-600 hover:text-indigo-800 px-3 py-2"
              >
                Login
              </Link>
              <Link
                to="/users/register/"
                className="text-indigo-600 hover:text-indigo-800 px-3 py-2"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Navigation */}
        <button onClick={toggleMenu} className="md:hidden text-gray-600">
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden mt-4 pb-2">
          <form onSubmit={handleSearch} className="relative mb-4">
            <input
              type="text"
              placeholder="Search courses..."
              className="w-full py-2 px-4 pr-10 rounded-full border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <Search size={18} className="text-gray-500" />
            </button>
          </form>

          <div className="flex flex-col space-y-2">
            {isAuthenticated ? (
              <>
                <Link
                  to={`/users/${user?.id}`}
                  className="flex items-center px-3 py-2 text-gray-800 hover:bg-indigo-50 rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Create Course
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="text-red-600 hover:text-red-800 px-3 py-2 text-left"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login/"
                  className="px-3 py-2 text-gray-800 hover:bg-indigo-50 rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/users/register/"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-center transition duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;