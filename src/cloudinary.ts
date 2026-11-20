// Cloudinary Free Media & Document Management Service (DMS)
// Cloud: babzu5oi | 25 GB Free Storage & CDN

export const CLOUDINARY_CONFIG = {
  cloudName: 'babzu5oi',
  apiKey: '169795463469764',
  apiSecret: 'ZS43Fx8X-NGGJ2umeMCr2lYKMVU',
  folder: 'macrown',
};

/**
 * Computes a SHA-1 hex hash using browser-native Web Crypto API
 */
async function sha1Hex(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface CloudinaryUploadResult {
  url: string;
  size: number;
  format?: string;
  publicId?: string;
}

/**
 * Direct signed upload to Cloudinary for images and PDF documents.
 * 100% Free with no Google Cloud / Blaze account or credit card required.
 */
export async function uploadToCloudinary(
  file: File,
  folderType: 'images' | 'documents' = 'images',
  onProgress?: (percent: number) => void
): Promise<CloudinaryUploadResult> {
  const { cloudName, apiKey, apiSecret, folder } = CLOUDINARY_CONFIG;
  const targetFolder = `${folder}/${folderType}`;
  const timestamp = Math.round(Date.now() / 1000);

  // Parameters to sign in alphabetical order
  const strToSign = `folder=${targetFolder}&timestamp=${timestamp}${apiSecret}`;
  const signature = await sha1Hex(strToSign);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('folder', targetFolder);
  formData.append('signature', signature);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve({
            url: res.secure_url || res.url,
            size: res.bytes || file.size,
            format: res.format,
            publicId: res.public_id,
          });
        } catch {
          reject(new Error('Failed to parse Cloudinary response.'));
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          reject(new Error(errData?.error?.message || `Cloudinary upload failed: ${xhr.statusText}`));
        } catch {
          reject(new Error(`Cloudinary upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      // Local fallback in case of offline/network failure
      console.warn('Network error uploading to Cloudinary, falling back to local encoding.');
      const reader = new FileReader();
      reader.onload = (e) =>
        resolve({
          url: e.target?.result as string,
          size: file.size,
        });
      reader.onerror = () => reject(new Error('Local fallback failed.'));
      reader.readAsDataURL(file);
    };

    const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|svg)$/i.test(file.name);
    const resourceType = isImage ? 'image' : 'raw';
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`);
    xhr.send(formData);
  });
}
