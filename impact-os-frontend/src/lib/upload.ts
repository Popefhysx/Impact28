/**
 * Upload Utility - Pre-signed URL Flow
 * 
 * Flow:
 * 1. Compress image to WebP in browser
 * 2. Get signed URL from backend
 * 3. Upload directly to R2
 * 4. Return the imageKey for use in form submission
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export type UploadType = 'testimonial' | 'partner' | 'avatar' | 'intake';

interface SignedUrlResponse {
    uploadUrl: string;
    key: string;
    publicUrl: string;
}

/**
 * Compress an image file to WebP format
 * Returns a Blob ready for upload
 */
export async function compressImage(
    file: File,
    options: {
        maxWidth?: number;
        maxHeight?: number;
        quality?: number;
    } = {}
): Promise<Blob> {
    const { maxWidth = 400, maxHeight = 400, quality = 0.8 } = options;

    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = () => {
            // Calculate dimensions maintaining aspect ratio
            let { width, height } = img;

            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
            }

            canvas.width = width;
            canvas.height = height;

            // Draw and compress
            ctx?.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to compress image'));
                    }
                },
                'image/webp',
                quality
            );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Get a pre-signed URL for uploading
 */
async function getSignedUrl(
    type: UploadType,
    contentType: string = 'image/webp'
): Promise<SignedUrlResponse> {
    const res = await fetch(`${API_BASE}/uploads/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, contentType }),
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to get upload URL');
    }

    return res.json();
}

/**
 * Upload a file directly to R2 using pre-signed URL
 */
async function uploadToR2(uploadUrl: string, blob: Blob): Promise<void> {
    const res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': blob.type },
        body: blob,
    });

    if (!res.ok) {
        throw new Error('Failed to upload to storage');
    }
}

/**
 * Complete upload flow:
 * 1. Compress image
 * 2. Get signed URL
 * 3. Upload to R2
 * 4. Return imageKey and publicUrl
 */
export async function uploadImage(
    file: File,
    type: UploadType,
    options?: {
        maxWidth?: number;
        maxHeight?: number;
        quality?: number;
        onProgress?: (stage: 'compressing' | 'uploading') => void;
    }
): Promise<{ imageKey: string; publicUrl: string }> {
    const { onProgress, ...compressOptions } = options || {};

    // Step 1: Compress
    onProgress?.('compressing');
    const compressedBlob = await compressImage(file, compressOptions);

    // Step 2: Get signed URL
    const { uploadUrl, key, publicUrl } = await getSignedUrl(type, 'image/webp');

    // Step 3: Upload to R2
    onProgress?.('uploading');
    await uploadToR2(uploadUrl, compressedBlob);

    // Step 4: Return the key and URL
    return { imageKey: key, publicUrl };
}

/**
 * Validate that a file is an acceptable image
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (!ALLOWED_TYPES.includes(file.type)) {
        return { valid: false, error: 'Please upload a JPEG, PNG, or WebP image' };
    }

    if (file.size > MAX_SIZE) {
        return { valid: false, error: 'Image must be less than 10MB' };
    }

    return { valid: true };
}
