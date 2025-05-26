import React from 'react';
import { Photo } from '../../types';
import { Trash2, Plus } from 'lucide-react';
import Button from '../common/Button';

interface PhotoGalleryProps {
  photos: Photo[];
  isOwnProfile: boolean;
  onAddPhoto?: () => void;
  onDeletePhoto: (id: string) => void;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  isOwnProfile,
  onAddPhoto,
  onDeletePhoto,
}) => {
  if (photos === null || photos.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500 mb-6">No photos to display</p>
        {isOwnProfile && (
          <Button
            variant="outline"
            onClick={onAddPhoto}
          >
            <Plus size={16} className="mr-2" />
            Add Your First Photo
          </Button>
        )}
      </div>
    );
  }

  return (
    <div>
      {isOwnProfile && (
        <div className="mb-6 flex justify-end">
          <Button
            variant="primary"
            onClick={onAddPhoto}
          >
            <Plus size={16} className="mr-2" />
            Add Photo
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <div key={photo.id} className="group relative overflow-hidden rounded-lg shadow-md bg-white">
            <img
              src={photo.content_url}
              alt={'User photo'}
              className="w-full h-48 object-cover transform group-hover:scale-105 transition-transform duration-300"
            />

            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-40 transition-opacity duration-300"></div>

            {isOwnProfile && onDeletePhoto && (
              <button
                onClick={() => onDeletePhoto(photo.id.toString())}
                className="absolute top-2 right-2 p-1.5 bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-700"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhotoGallery;