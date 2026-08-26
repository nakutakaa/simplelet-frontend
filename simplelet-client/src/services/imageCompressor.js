import imageCompression from 'browser-image-compression';

export const compressImage = async (file) => {
  // If file is already small (under 300KB), return it directly
  if (file.size <= 300 * 1024) {
    return file;
  }

  const options = {
    maxSizeMB: 0.8,            // Target size under 800KB
    maxWidthOrHeight: 1920,     // Max 1080p/2K resolution
    useWebWorker: true,
    fileType: 'image/jpeg',     // Retains JPEG structure so EXIF headers stay intact
    preserveExif: true,         // CRITICAL: Keeps GPS and camera data for Flask validation
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.warn(`Compression failed for ${file.name}, using raw file:`, error);
    return file; // Fallback to raw file if compression fails
  }
};
