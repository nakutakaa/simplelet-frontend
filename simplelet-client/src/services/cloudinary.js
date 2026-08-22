// src/services/cloudinary.js
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_UPLOAD_PRESET;

export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "simplelet/listings");

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Upload failed");
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      public_id: data.public_id,
      thumbnail: data.secure_url.replace(
        "/upload/",
        "/upload/w_300,h_200,c_fill/",
      ),
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};
