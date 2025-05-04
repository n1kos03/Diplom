import React from 'react';
import { User as UserType } from '../../types';
import { Calendar, MapPin, Link, LinkIcon } from 'lucide-react';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';

interface ProfileHeaderProps {
  user: UserType;
  isOwnProfile: boolean;
  onEditProfile?: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  isOwnProfile,
  onEditProfile,
}) => {
  const { nickname, bio, created_at } = user;

  // Format the join date
  const joinDate = new Date(created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Cover Photo - Gradient Background as placeholder*/}
      <div className="h-40 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
    
      <div className="relative px-6 py-5">
        {/* Avatar */}
        <div className="absolute -top-16 left-6 border-4 border-white rounded-full">
          <div className="w-32 h-32 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-indigo-600 text-4xl font-bold">
              {nickname.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Profile Actions */}
        <div className="flex justify-end mb-8">
          {isOwnProfile ? (
            <Button
              variant="outline"
              size="small"
              onClick={onEditProfile}
            >
              Edit Profile
            </Button>
          ) : (
            <Button
              variant='primary'
              size='small'
            >
              Follow
            </Button>
          )}
        </div>

        {/* User Info */}
        <div className="mt-8">
          <h1 className="text-2xl font-bold text-gray-900">{nickname}</h1>

          <p className="mt-4 text-gray-600">{bio}</p>

          <div className="mt-4 flex flex-wrap items-center text-sm text-gray-500 gap-y-2">
            <div className="flex items-center mr-4">
              <Calendar size={16} className="mr-1" />
              <span>Joined {joinDate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;