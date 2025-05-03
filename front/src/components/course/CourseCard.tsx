import React from 'react';
import { Link } from 'react-router-dom';
import { Course } from '../../types';
import { Clock, User } from 'lucide-react';

interface CourseCardProps {
  course: Course;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const { id, author_name, created_at, title, description } = course;

  // Format date
  const formattedDate = new Date(created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Truncate description if too long
  const truncatedDescription = description.length > 120
  ? `${description.slice(0, 120)}...`
  : description;

  return (
    <Link to={`/courses/${id}`} className="group">
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
      {/* Course Image - using a placeholder for now */}
      <div className="relative h-48 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20 group-hover:opacity-10 transition-opacity duration-300"></div>
        <h3 className="text-white text-xl font-bold px-4 text-center z-10">{title}</h3>
      </div>
      
      <div className="p-5 flex-1 flex flex-col">
        {/* Author and date info */}
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <div className="flex items-center mr-4">
            <User size={14} className="mr-1" />
            <span>{author_name}</span>
          </div>
          <div className="flex items-center">
            <Clock size={14} className="mr-1" />
            <span>{formattedDate}</span>
          </div>
        </div>
        
        {/* Course description */}
        <p className="text-gray-600 text-sm mb-4 flex-1">{truncatedDescription}</p>
        
        {/* View Course Button */}
        <div className="mt-auto pt-2">
          <span className="inline-block text-indigo-600 font-medium group-hover:text-indigo-800 transition-colors duration-300">
            View Course
            <span className="ml-1 transition-transform duration-300 group-hover:translate-x-1 inline-block">→</span>
          </span>
        </div>
      </div>
    </div>
  </Link>
  );
};

export default CourseCard;