// src/pages/CreateListingPage.jsx
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import API from "../services/api";
import { XMarkIcon, PhotoIcon } from "@heroicons/react/24/outline";

// House types from backend
const HOUSE_TYPES = [
  { value: "bedsitter", label: "Bedsitter" },
  { value: "studio", label: "Studio" },
  { value: "single_room", label: "Single Room" },
  { value: "1bed_bungalow", label: "1 Bedroom Bungalow" },
  { value: "2bed_bungalow", label: "2 Bedroom Bungalow" },
  { value: "1bed_apartment", label: "1 Bedroom Apartment" },
  { value: "2bed_apartment", label: "2 Bedroom Apartment" },
  { value: "3bed_apartment", label: "3 Bedroom Apartment" },
  { value: "commercial", label: "Commercial Space" },
];

// Create listing mutation
const createListing = async (listingData) => {
  const { data } = await API.post("/listings", listingData);
  return data;
};

// Upload images mutation
const uploadImages = async ({ listingId, images }) => {
  const formData = new FormData();
  images.forEach((image) => {
    formData.append("images", image);
  });
  const { data } = await API.post(`/listings/${listingId}/images`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export default function CreateListingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [listingId, setListingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    house_type: "studio",
    location: "",
    description: "",
    price: "",
    contact_phone: "",
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Create listing mutation
  const createMutation = useMutation({
    mutationFn: createListing,
    onSuccess: (data) => {
      setListingId(data.id);
      if (images.length > 0) {
        uploadMutation.mutate({ listingId: data.id, images });
      } else {
        toast.success("Listing created successfully!");
        queryClient.invalidateQueries(["myListings"]);
        navigate("/dashboard");
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to create listing");
    },
  });

  // Upload images mutation
  const uploadMutation = useMutation({
    mutationFn: uploadImages,
    onSuccess: () => {
      toast.success("Listing created with images!");
      queryClient.invalidateQueries(["myListings"]);
      navigate("/dashboard");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.error ||
          "Images upload failed, but listing was created",
      );
      navigate("/dashboard");
    },
  });

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission (step 1)
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!formData.house_type || !formData.location) {
      toast.error("House type and location are required");
      return;
    }

    if (formData.price && isNaN(parseFloat(formData.price))) {
      toast.error("Price must be a number");
      return;
    }

    createMutation.mutate(formData);
  };

  // Dropzone for image upload
  const onDrop = useCallback(
    (acceptedFiles) => {
      const maxImages = 10;
      const currentCount = images.length;
      const remainingSlots = maxImages - currentCount;

      if (acceptedFiles.length > remainingSlots) {
        toast.error(
          `You can only upload ${remainingSlots} more image(s). Max 10 total.`,
        );
        return;
      }

      // Validate file sizes and types
      const validFiles = [];
      const invalidFiles = [];

      acceptedFiles.forEach((file) => {
        if (file.size > 10 * 1024 * 1024) {
          invalidFiles.push(`${file.name}: exceeds 10MB`);
        } else if (!file.type.startsWith("image/")) {
          invalidFiles.push(`${file.name}: not an image`);
        } else {
          validFiles.push(file);
        }
      });

      if (invalidFiles.length > 0) {
        toast.error(invalidFiles.join(", "));
      }

      if (validFiles.length > 0) {
        setImages([...images, ...validFiles]);

        // Create preview URLs
        const newPreviews = validFiles.map((file) => ({
          url: URL.createObjectURL(file),
          name: file.name,
        }));
        setImagePreviews([...imagePreviews, ...newPreviews]);
      }
    },
    [images, imagePreviews],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxSize: 10 * 1024 * 1024,
  });

  // Remove image
  const removeImage = (index) => {
    // Revoke object URL to avoid memory leaks
    URL.revokeObjectURL(imagePreviews[index].url);

    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);

    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
  };

  const isSubmitting = createMutation.isPending || uploadMutation.isPending;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-6">Post a New Listing</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* House Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property Type *
            </label>
            <select
              name="house_type"
              value={formData.house_type}
              onChange={handleChange}
              className="input"
              required
            >
              {HOUSE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title (Optional)
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Spacious 2BR with Great View"
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave blank to auto-generate from property type and location
            </p>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Kilimani, Nairobi"
              className="input"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Describe the property, amenities, nearby facilities..."
              className="input resize-none"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (KSh per month)
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="e.g., 25000"
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave blank if price is negotiable
            </p>
          </div>

          {/* Contact Phone (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Phone (Optional)
            </label>
            <input
              type="tel"
              name="contact_phone"
              value={formData.contact_phone}
              onChange={handleChange}
              placeholder="Leave blank to use your registered number"
              className="input"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Images (Max 10)
            </label>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition
                ${isDragActive ? "border-primary-500 bg-primary-50" : "border-gray-300 hover:border-primary-400"}`}
            >
              <input {...getInputProps()} />
              <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              {isDragActive ? (
                <p className="text-primary-600">Drop the images here...</p>
              ) : (
                <p className="text-gray-500">
                  Drag & drop images here, or click to select
                </p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                Max 10 images, up to 10MB each (JPG, PNG, GIF, WebP)
              </p>
            </div>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview.url}
                      alt={preview.name}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-500 mt-2">
              {images.length} / 10 images selected
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="flex-1 btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Post Listing"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
