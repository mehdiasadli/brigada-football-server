import { v2 as cloudinary } from 'cloudinary';
import { appConfig } from 'src/_common/config';

export const CLOUDINARY_PROVIDER = 'CLOUDINARY';

export const CloudinaryProvider = {
  provide: CLOUDINARY_PROVIDER,
  useFactory: () => {
    cloudinary.config({
      cloud_name: appConfig.CLOUDINARY_CLOUD_NAME,
      api_key: appConfig.CLOUDINARY_API_KEY,
      api_secret: appConfig.CLOUDINARY_API_SECRET,
    });

    return cloudinary;
  },
};
