import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ProfileHeader from '../components/user/ProfileHeader';
import UserCourses from '../components/user/UserCourses';
import PhotoGallery from '../components/user/PhotoGallery';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Alert from '../components/common/Alert';
import { User, Course, Photo } from '../types';
import { getUserProfile, getUserPhotos, uploadUserPhoto, deleteUserPhoto } from '../services/userService';

enum TabType {
  PHOTOS = 'photos',
  COURSES = 'courses',
}

const UserProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();

  // const uploadRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>(TabType.PHOTOS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);

  const isOwnProfile = !!currentUser && currentUser.id.toString() === id;

  useEffect(() => {
    if (!id) return;

    const fetchUserData = async () => {
      setLoading(true);
      try {
        const userProfile = await getUserProfile(id);
        setUser(userProfile);

        const userPhotos = await getUserPhotos(id);
        setPhotos(userPhotos);

        // const userCourses = await getUserCourses(id);
        // setCourses(userCourses);
      } catch (err) {
        setError('Failed to load user profile');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  const handlePhotoUpload = async (formData: FormData) => {
    try {
      const newPhoto = await uploadUserPhoto(formData);
      setPhotos([newPhoto, ...photos]);
      setShowPhotoUpload(false);
    } catch (err) {
      setError('Failed to upload photo');
      console.error(err);
    }
  };

  const handlePhotoDelete = async (photoId: string) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;

    try {
      await deleteUserPhoto(photoId);
      setPhotos(photos.filter((photo) => photo.id.toString() !== photoId));
    } catch (err) {
      setError('Failed to delete photo');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex item-center justify-center">
          <LoadingSpinner size="large" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex item-center justify-center p-4">
          <Alert
            type="error"
            message={error || 'User not found'}
            onClose={() => setError(null)}
          />
        </main>
        <Footer />
      </div>
    );
  }

  return (
     <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="flex-grow py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <ProfileHeader 
            user={user} 
            isOwnProfile={isOwnProfile} 
            onEditProfile={() => {/* Handle edit profile */}}
          />
          
          {/* Tabs Navigation */}
          <div className="mt-8 bg-white rounded-lg shadow-md">
            <div className="border-b">
              <nav className="flex">
                <button
                  className={`py-4 px-6 font-medium text-sm focus:outline-none ${
                    activeTab === TabType.PHOTOS
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab(TabType.PHOTOS)}
                >
                  Photos
                </button>
                <button
                  className={`py-4 px-6 font-medium text-sm focus:outline-none ${
                    activeTab === TabType.COURSES
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab(TabType.COURSES)}
                >
                  Courses
                </button>
              </nav>
            </div>
            
            {/* Tab Content */}
            <div className="p-6">
              {activeTab === TabType.PHOTOS ? (
                <>
                  {showPhotoUpload && isOwnProfile ? (
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4">Upload New Photo</h3>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target as HTMLFormElement);
                        formData.append('user_id', id);
                        handlePhotoUpload(formData);
                      }}>
                        {/* <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Photo Title
                          </label>
                          <input
                            type="text"
                            name="title"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Give your photo a title"
                          />
                        </div> */}
                        
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Photo file
                          </label>
                          <input
                            type="file"
                            // ref={uploadRef}
                            // id="photo"
                            name="file"
                            accept="*"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            required
                          />
                        </div>

                        <div className="flex space-x-3">
                          <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-center transition"
                          >
                            Upload Photo
                          </button>
                          <button
                            type="button"
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition"
                            onClick={() => setShowPhotoUpload(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <PhotoGallery 
                      photos={photos}
                      isOwnProfile={isOwnProfile}
                      onAddPhoto={() => setShowPhotoUpload(true)}
                      onDeletePhoto={handlePhotoDelete}
                    />
                  )}
                </>
              ) : (
                <UserCourses
                  courses={courses}
                  isOwnProfile={isOwnProfile}
                  // isAuthor={user.isAuthor}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UserProfile;