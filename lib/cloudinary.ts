import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'hypt4up2',
  api_key: process.env.CLOUDINARY_API_KEY || '988348462547293',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Bm0By_YghP0Ed45_6F6cY7AFw5o',
  secure: true,
});

export { cloudinary };

export async function uploadImageToCloudinary(
  fileBase64OrUrl: string,
  folder: string = 'venuefinder'
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      fileBase64OrUrl,
      {
        folder,
        resource_type: 'image',
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error('Cloudinary upload failed'));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );
  });
}
