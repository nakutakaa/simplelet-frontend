// src/pages/EditListingPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import API from "../services/api";
import { XMarkIcon, PhotoIcon } from "@heroicons/react/24/outline";

// House types (same as create page)
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

// Fetch single listing
const fetchListing = async (id) => {
  const { data } = await API.get(`/listings/${id}`);
  return data;
};

// Update listing
const updateListing = async ({ id, ...listingData }) => {
  const { data } = await API.put(`/listings/${id}`, listingData);
  return data;
};

// Delete existing image
const deleteImage = async (imageId) => {
  const { data } = await API.delete(`/listings/images/${imageId}`);
  return data;
};

// Upload new images
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

export default function EditListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    house_type: "studio",
    location: "",
    description: "",
    price: "",
    contact_phone: "",
  });

  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);

  // Fetch existing listing data
  const {
    data: listing,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => fetchListing(id),
  });

  // Populate form when data loads
  useEffect(() => {
    if (listing) {
      setFormData({
        title: listing.title || "",
        house_type: listing.house_type,
        location: listing.location,
        description: listing.description || "",
        price: listing.price || "",
        contact_phone: listing.contact_phone || "",
      });
      setExistingImages(listing.images || []);
    }
  }, [listing]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: updateListing,
    onSuccess: async () => {
      // Handle image deletions
      for (const imageId of imagesToDelete) {
        await deleteImage(imageId);
      }

      // Handle new image uploads
      if (newImages.length > 0) {
        await uploadImages({ listingId: id, images: newImages });
      }

      toast.success("Listing updated successfully!");
      queryClient.invalidateQueries(["myListings"]);
      queryClient.invalidateQueries(["listing", id]);
      navigate("/dashboard");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to update listing");
    },
  });

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.house_type || !formData.location) {
      toast.error("House type and location are required");
      return;
    }

    updateMutation.mutate({ id, ...formData });
  };

  // Remove existing image
  const removeExistingImage = (image) => {
    setImagesToDelete([...imagesToDelete, image.id]);
    setExistingImages(existingImages.filter((img) => img.id !== image.id));
  };

  // Dropzone for new images
  const onDrop = (acceptedFiles) => {
    const currentCount = existingImages.length + newImages.length;
    const remainingSlots = 10 - currentCount;

    if (acceptedFiles.length > remainingSlots) {
      toast.error(
        `You can only upload ${remainingSlots} more image(s). Max 10 total.`,
      );
      return;
    }

    const validFiles = [];
    acceptedFiles.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: exceeds 10MB`);
      } else if (!file.type.startsWith("image/")) {
        toast.error(`${file.name}: not an image`);
      } else {
        validFiles.push(file);
      }
    });

    if (validFiles.length > 0) {
      setNewImages([...newImages, ...validFiles]);

      const newPreviews = validFiles.map((file) => ({
        url: URL.createObjectURL(file),
        name: file.name,
      }));
      setNewImagePreviews([...newImagePreviews, ...newPreviews]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxSize: 10 * 1024 * 1024,
  });

  // Remove new image
  const removeNewImage = (index) => {
    URL.revokeObjectURL(newImagePreviews[index].url);
    const updatedImages = [...newImages];
    updatedImages.splice(index, 1);
    setNewImages(updatedImages);

    const updatedPreviews = [...newImagePreviews];
    updatedPreviews.splice(index, 1);
    setNewImagePreviews(updatedPreviews);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Listing not found</p>
      </div>
    );
  }

  const totalImages = existingImages.length + newImages.length;
  const isSubmitting = updateMutation.isPending;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-6">Edit Listing</h1>

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
              placeholder="Describe the property..."
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
          </div>

          {/* Contact Phone */}
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

          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Images ({existingImages.length})
              </label>
              <div className="grid grid-cols-4 gap-3">
                {existingImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.thumbnail}
                      alt="Listing"
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(image)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Images Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add More Images ({totalImages}/10)
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
                  Drag & drop new images here, or click to select
                </p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                Max 10 images total, up to 10MB each
              </p>
            </div>

            {/* New Image Previews */}
            {newImagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {newImagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview.url}
                      alt={preview.name}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
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
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
