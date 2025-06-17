// common/middleware/multer.config.ts
import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { Request } from 'express';

// File filter for images only
const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];

  if (allowedMimeTypes.includes(file.mimetype as unknown as string)) {
    callback(null, true);
  } else {
    callback(
      new BadRequestException('Invalid file type. Only images are allowed.'),
      false,
    );
  }
};

// Size limits
const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 10;

// Multer configuration for avatar uploads
export const avatarMulterConfig: MulterOptions = {
  storage: undefined, // Use memory storage
  fileFilter: imageFileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMIT,
    files: 1, // Only one avatar file
  },
};

// Multer configuration for post images
export const postImagesMulterConfig: MulterOptions = {
  storage: undefined, // Use memory storage
  fileFilter: imageFileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMIT,
    files: MAX_FILES, // Maximum 10 images per post
  },
};

// General image upload configuration
export const imageMulterConfig: MulterOptions = {
  storage: undefined, // Use memory storage
  fileFilter: imageFileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMIT,
    files: MAX_FILES,
  },
};

// Custom decorators for different upload types
import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

// Avatar upload decorator
export function UploadAvatar() {
  return applyDecorators(
    UseInterceptors(FileInterceptor('avatar', avatarMulterConfig)),
  );
}

// Post images upload decorator
export function UploadPostImages() {
  return applyDecorators(
    UseInterceptors(
      FilesInterceptor('images', MAX_FILES, postImagesMulterConfig),
    ),
  );
}

// General image upload decorator
export function UploadImages(
  fieldName: string = 'images',
  maxCount: number = MAX_FILES,
) {
  return applyDecorators(
    UseInterceptors(FilesInterceptor(fieldName, maxCount, imageMulterConfig)),
  );
}

// Single image upload decorator
export function UploadImage(fieldName: string = 'image') {
  return applyDecorators(
    UseInterceptors(FileInterceptor(fieldName, imageMulterConfig)),
  );
}
