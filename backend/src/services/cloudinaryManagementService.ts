import cloudinary from 'configs/cloudinary';
import AppError from 'utils/appError';

class CloudinaryManagementService {
  static async uploadSinglePhotoToCloudinary (photoFile: any) {
    if (!photoFile || !photoFile.path) {
      throw new AppError(500, 'Invalid photo file provided. Couldnt upload');
    }

    try {
      const uploadedPhoto = await cloudinary.uploader.upload(photoFile.path);

      if (!uploadedPhoto.secure_url || !uploadedPhoto.public_id) {
        throw new AppError(
          500, 
          'Unable to upload the photo. Maybe servers are down. Refresh the page and try again.'
        );
      }

      return {
        secure_url: uploadedPhoto.secure_url,
        public_id: uploadedPhoto.public_id
      };
    } catch (error: unknown) {
      throw new AppError(
        500, 
        'Unable to upload the photo. Maybe servers are down. Refresh the page and try again.'
      );
    }
  }
}

export default CloudinaryManagementService;