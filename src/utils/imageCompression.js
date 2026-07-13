// ============================================================
// Client-Side Image Compression using Canvas API
// Target: 70% quality, max 1200px width, max 2MB output
// ============================================================

const MAX_WIDTH = 1200;
const INITIAL_QUALITY = 0.7;
const MIN_QUALITY = 0.3;
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

/**
 * Compress an image file using Canvas API
 * @param {File} file - The image file to compress
 * @returns {Promise<{ compressedFile: File, originalSize: number, compressedSize: number }>}
 */
export async function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      resolve({ compressedFile: file, originalSize: file.size, compressedSize: file.size });
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = async () => {
        try {
          const compressedBlob = await compressWithQuality(img, file, INITIAL_QUALITY);
          const compressedFile = new File([compressedBlob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          resolve({
            compressedFile,
            originalSize: file.size,
            compressedSize: compressedFile.size,
          });
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}

async function compressWithQuality(img, originalFile, quality) {
  // Calculate dimensions maintaining aspect ratio
  let width = img.width;
  let height = img.height;

  if (width > MAX_WIDTH) {
    height = Math.round((height * MAX_WIDTH) / width);
    width = MAX_WIDTH;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error('Canvas to blob failed'));
          return;
        }

        // If still too large and quality can be reduced further, recurse
        if (blob.size > MAX_FILE_SIZE_BYTES && quality - 0.1 >= MIN_QUALITY) {
          const smallerBlob = await compressWithQuality(img, originalFile, quality - 0.1);
          resolve(smallerBlob);
        } else {
          resolve(blob);
        }
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Format file size in human-readable form
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Generate preview URL for a file
 */
export function generatePreview(file) {
  if (file.type.startsWith('image/')) {
    return URL.createObjectURL(file);
  }
  return null; // PDF or other - use icon
}

/**
 * Convert file to base64 for LocalStorage persistence
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });
}
