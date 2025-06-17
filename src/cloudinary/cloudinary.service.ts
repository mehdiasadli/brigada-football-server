// cloudinary/cloudinary.service.ts
import {
  Injectable,
  Inject,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  v2 as v2Cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';
import { Readable } from 'stream';
import { CLOUDINARY_PROVIDER } from './cloudinary.provider';

export interface UploadOptions {
  folder?: string;
  transformation?: any;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  quality?: string | number;
  width?: number;
  height?: number;
  crop?: string;
  format?: string;
  public_id?: string;
}

export interface CloudinaryImage {
  publicId: string;
  url: string;
  secureUrl: string;
  originalFilename?: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

@Injectable()
export class CloudinaryService {
  constructor(
    @Inject(CLOUDINARY_PROVIDER) private cloudinary: typeof v2Cloudinary,
  ) {}

  /**
   * Upload single image from buffer
   */
  async uploadImage(
    fileBuffer: Buffer,
    originalFilename: string,
    options: UploadOptions = {},
  ): Promise<CloudinaryImage> {
    try {
      const defaultOptions: UploadOptions = {
        folder: 'brigada-football',
        resource_type: 'image',
        quality: 'auto:good',
        format: 'webp', // Convert to WebP for better compression
        ...options,
      };

      // Create a readable stream from buffer
      const stream = new Readable();
      stream.push(fileBuffer);
      stream.push(null);

      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = this.cloudinary.uploader.upload_stream(
          {
            ...defaultOptions,
            public_id: this.generatePublicId(originalFilename),
          },
          (
            error: UploadApiErrorResponse | undefined,
            result: UploadApiResponse | undefined,
          ) => {
            if (error) {
              reject(new Error(error.message));
            } else if (result) {
              resolve(result);
            } else {
              reject(new Error('Upload failed'));
            }
          },
        );

        stream.pipe(uploadStream);
      });

      return {
        publicId: result.public_id,
        url: result.url,
        secureUrl: result.secure_url,
        originalFilename,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new InternalServerErrorException('Failed to upload image');
    }
  }

  /**
   * Upload multiple images
   */
  async uploadMultipleImages(
    files: Array<{ buffer: Buffer; originalname: string }>,
    options: UploadOptions = {},
  ): Promise<CloudinaryImage[]> {
    try {
      const uploadPromises = files.map((file) =>
        this.uploadImage(file.buffer, file.originalname, options),
      );

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Multiple upload error:', error);
      throw new InternalServerErrorException('Failed to upload images');
    }
  }

  /**
   * Upload avatar with specific transformations
   */
  async uploadAvatar(
    fileBuffer: Buffer,
    originalFilename: string,
    userId: string,
  ): Promise<CloudinaryImage> {
    const options: UploadOptions = {
      folder: 'brigada-football/avatars',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto:good' },
        { format: 'webp' },
      ],
      public_id: `avatar_${userId}_${Date.now()}`,
    };

    return this.uploadImage(fileBuffer, originalFilename, options);
  }

  /**
   * Upload post images with optimization
   */
  async uploadPostImages(
    files: Array<{ buffer: Buffer; originalname: string }>,
    postId: string,
  ): Promise<CloudinaryImage[]> {
    const options: UploadOptions = {
      folder: 'brigada-football/posts',
      transformation: [
        { width: 1200, height: 800, crop: 'limit' },
        { quality: 'auto:good' },
        { format: 'webp' },
      ],
    };

    // Add postId to public_id for easier management
    const filesWithPostId = files.map((file, index) => ({
      ...file,
      originalname: `post_${postId}_${index}_${file.originalname}`,
    }));

    return this.uploadMultipleImages(filesWithPostId, options);
  }

  /**
   * Delete single image by public ID
   */
  async deleteImage(publicId: string): Promise<boolean> {
    try {
      const result = await this.cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return false;
    }
  }

  /**
   * Delete multiple images by public IDs
   */
  async deleteMultipleImages(
    publicIds: string[],
  ): Promise<{ success: string[]; failed: string[] }> {
    try {
      const deletePromises = publicIds.map(async (publicId) => {
        try {
          const success = await this.deleteImage(publicId);
          return { publicId, success };
        } catch (error) {
          console.error('Cloudinary delete error:', error);
          return { publicId, success: false };
        }
      });

      const results = await Promise.all(deletePromises);

      return {
        success: results.filter((r) => r.success).map((r) => r.publicId),
        failed: results.filter((r) => !r.success).map((r) => r.publicId),
      };
    } catch (error) {
      console.error('Multiple delete error:', error);
      return { success: [], failed: publicIds };
    }
  }

  /**
   * Extract public ID from Cloudinary URL
   */
  extractPublicId(imageUrl: string): string | null {
    try {
      // Handle both HTTP and HTTPS URLs
      const urlPattern =
        /\/(?:v\d+\/)?([^\\/]+\/[^\\/]+\/[^\\/]+)\.(?:jpg|jpeg|png|gif|webp|svg)$/i;
      const match = imageUrl.match(urlPattern);

      if (match) {
        return match[1];
      }

      // Alternative pattern for direct public IDs
      const directPattern = /\/([^\\/]+)\.(?:jpg|jpeg|png|gif|webp|svg)$/i;
      const directMatch = imageUrl.match(directPattern);

      return directMatch ? directMatch[1] : null;
    } catch (error) {
      console.error('Error extracting public ID:', error);
      return null;
    }
  }

  /**
   * Extract multiple public IDs from URLs
   */
  extractPublicIds(imageUrls: string[]): string[] {
    return imageUrls
      .map((url) => this.extractPublicId(url))
      .filter((publicId): publicId is string => publicId !== null);
  }

  /**
   * Delete images by URLs (extracts public IDs first)
   */
  async deleteImagesByUrls(
    imageUrls: string[],
  ): Promise<{ success: string[]; failed: string[] }> {
    const publicIds = this.extractPublicIds(imageUrls);

    if (publicIds.length === 0) {
      return { success: [], failed: imageUrls };
    }

    return this.deleteMultipleImages(publicIds);
  }

  /**
   * Clean up old avatar when user uploads new one
   */
  async replaceAvatar(
    oldAvatarUrl: string | null,
    newFileBuffer: Buffer,
    originalFilename: string,
    userId: string,
  ): Promise<CloudinaryImage> {
    console.log('--------------------------------');
    console.log('--------------------------------');
    console.log('--------------------------------');
    console.log('inputs of replace avatar');
    console.log('--------------------------------');
    console.log('oldAvatarUrl', oldAvatarUrl);
    console.log('newFileBuffer', newFileBuffer);
    console.log('originalFilename', originalFilename);
    console.log('userId', userId);
    console.log('--------------------------------');
    console.log('--------------------------------');
    console.log('--------------------------------');

    // Upload new avatar first
    const newAvatar = await this.uploadAvatar(
      newFileBuffer,
      originalFilename,
      userId,
    );
    console.log('newAvatar', newAvatar);
    console.log('--------------------------------');
    console.log('--------------------------------');

    // Delete old avatar if exists
    if (oldAvatarUrl) {
      const oldPublicId = this.extractPublicId(oldAvatarUrl);
      console.log('oldPublicId', oldPublicId);
      console.log('--------------------------------');
      console.log('--------------------------------');
      if (oldPublicId) {
        console.log('deleting old avatar');
        const result = await this.deleteImage(oldPublicId);
        console.log('result', result);
        console.log('old avatar deleted');
        console.log('--------------------------------');
        console.log('--------------------------------');
      }
    }

    return newAvatar;
  }

  /**
   * Generate unique public ID
   */
  private generatePublicId(originalFilename: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const cleanFilename = originalFilename
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^a-zA-Z0-9]/g, '_') // Replace special chars with underscore
      .toLowerCase();

    return `${cleanFilename}_${timestamp}_${random}`;
  }

  /**
   * Get optimized image URL with transformations
   */
  getOptimizedUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string;
      format?: string;
    } = {},
  ): string {
    return this.cloudinary.url(publicId, {
      secure: true,
      ...options,
    });
  }

  /**
   * Get image info by public ID
   */
  async getImageInfo(publicId: string): Promise<any> {
    try {
      return await this.cloudinary.api.resource(publicId);
    } catch (error) {
      console.error('Error getting image info:', error);
      return null;
    }
  }

  /**
   * Validate image file
   */
  validateImageFile(file: Express.Multer.File): boolean {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        'File size too large. Maximum size is 10MB.',
      );
    }

    // Check file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ];

    if (!allowedMimeTypes.includes(file.mimetype as unknown as string)) {
      throw new BadRequestException(
        'Invalid file type. Only images are allowed.',
      );
    }

    return true;
  }

  /**
   * Validate multiple image files
   */
  validateImageFiles(files: Express.Multer.File[]): boolean {
    // Check maximum number of files
    if (files.length > 10) {
      throw new BadRequestException(
        'Too many files. Maximum 10 images allowed.',
      );
    }

    files.forEach((file) => this.validateImageFile(file));
    return true;
  }
}
