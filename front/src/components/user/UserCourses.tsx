import React from 'react';
import { Course } from '../../types';
import CourseCard from '../course/CourseCard';
import Button from '../common/Button';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UserCoursesProps {
  courses: Course[];
  isOwnProfile: boolean;
  // isAuthor: boolean;
}

const UserCourses: React.FC<UserCoursesProps> = ({
  courses,
  isOwnProfile,
  // isAuthor,
}) => {
  if (courses.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500 mb-6">
          {isOwnProfile
            ? 'You have not subscribed to any courses yet'
            : 'This user has not created any courses yet'}
        </p>
        {isOwnProfile && /* isAuthor && */ (
          <Link to="/courses/course_creation/">
            <Button variant="primary">
              <Plus size={16} className="mr-2" />
              Create Your First Course
            </Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div>
      {isOwnProfile && /*isAuthor && */ (
        <div className="mb-6 flex justify-end">
          <Link to="/courses/course_creation/">
            <Button variant="primary">
              <Plus size={16} className="mr-2" />
              Create Course
            </Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
};

export default UserCourses;