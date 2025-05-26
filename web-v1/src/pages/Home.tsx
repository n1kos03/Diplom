import React, {useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import CourseCard from '../components/course/CourseCard';
import { getCourses } from '../services/courseService';
import { Course } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Alert from '../components/common/Alert';
import { Search, RefreshCcw } from 'lucide-react';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async (query?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCourses(query);
      setCourses(data);
    } catch (err) {
      setError('Failed to load courses.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    fetchCourses(query);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar onSearch={handleSearch} />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-6 sm:text-5xl md:text-6xl">
                Discover Your Artistic Potential
              </h1>
              <p className="text-xl mb-8 max-w-3xl mx-auto">
                Learn from expert artists and creators with our carefully curated courses
              </p>
              
              {/* Search Form */}
              <div className="max-w-xl mx-auto">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSearch(searchQuery);
                  }} 
                  className="relative"
                >
                  <input
                    type="text"
                    placeholder="Search for courses or techniques..."
                    className="w-full py-3 px-6 pr-12 rounded-full text-gray-800 shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-indigo-600 rounded-full text-white hover:bg-indigo-700 transition"
                  >
                    <Search size={18} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Courses Section */}
        <section className="py-12 px-4">
          <div className="max-w-7x1 mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2x1 font-bold text-gray-800">
                {searchQuery ? `Search Results for "${searchQuery}"` : 'Featured Courses'}
              </h2>

              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    fetchCourses();
                  }}
                  className="flex items-center text-indigo-600 hover:text-indigo-600"
                >
                  <RefreshCcw size={16} className="mr-1" />
                  Clear Search
                </button>
              )}
            </div>

            {error && (
              <Alert
                type="error"
                message={error}
                onClose={() => setError(null)}
              />
            )}

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <LoadingSpinner size="large" />
              </div>
            ) : courses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <h3 className="text-xl font-medium text-gray-700 mb-2">
                  No courses found
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery
                    ? "We couldn't find any courses matching your search query."
                    : "There are no courses available at the moment."}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      fetchCourses();
                    }}
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      View all courses instead
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
