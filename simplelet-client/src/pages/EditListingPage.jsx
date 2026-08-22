// src/pages/EditListingPage.jsx
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import API from "../services/api";
import { XMarkIcon, CameraIcon } from "@heroicons/react/24/outline";
import MapPicker from "../components/MapPicker";
import SafetyTip from "../components/SafetyTip";
import { uploadToCloudinary } from "../services/cloudinary.js";

// House types
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

// ============ Layer 1 Dropdown Options ============
const WATER_SOURCES = [
  { value: "nairobi_water", label: "Nairobi Water" },
  { value: "borehole", label: "Borehole" },
  { value: "combination", label: "Combination" },
];

const WATER_METERING = [
  { value: "flat_rate", label: "Flat Rate" },
  { value: "tokenized", label: "Tokenized" },
  { value: "included", label: "Included in Rent" },
];

const WATER_RATIONING = [
  { value: "none", label: "None" },
  { value: "mondays", label: "Mondays" },
  { value: "tuesdays", label: "Tuesdays" },
  { value: "wednesdays", label: "Wednesdays" },
  { value: "thursdays", label: "Thursdays" },
  { value: "fridays", label: "Fridays" },
  { value: "saturdays", label: "Saturdays" },
  { value: "sundays", label: "Sundays" },
  { value: "alternate_days", label: "Alternate Days" },
];

const POWER_METERING = [
  { value: "prepaid_kplc", label: "Prepaid KPLC Token" },
  { value: "sub_meter", label: "Sub-meter" },
];

const BACKUP_POWER = [
  { value: "full_generator", label: "Full Generator" },
  { value: "common_area", label: "Common Area Only" },
  { value: "solar", label: "Solar" },
  { value: "none", label: "None" },
];

// ============ ERROR MESSAGES ============
const getErrorMessage = (error, context = "edit_listing") => {
  const status = error.response?.status;
  const data = error.response?.data;
  const errorCode = data?.error_code || data?.error || "";

  const errorMap = {
    listing_not_found: "❌ Listing not found. It may have been deleted.",
    listing_inactive: "⛔ This listing is no longer active.",
    unauthorized: "🚫 You don't have permission to edit this listing.",
    update_failed: "❌ Failed to update listing. Please try again.",
    invalid_house_type: "🏠 Invalid property type selected.",
    invalid_price: "💰 Please enter a valid price.",
    price_negative: "💰 Price cannot be negative.",
    invalid_phone: "📱 Invalid phone number format.",
    image_delete_failed: "❌ Failed to delete image. Please try again.",
    image_upload_failed: "❌ Failed to upload images. Please try again.",
    image_rejected: "🚫 Some images were rejected. Check the reasons below.",
    network_error: "📡 Network error. Please check your connection.",
    server_error: "⚠️ Server error. Please try again later.",
  };

  if (errorCode && errorMap[errorCode]) {
    return errorMap[errorCode];
  }

  if (status === 400) return "⚠️ Please check your information and try again.";
  if (status === 401) return "🔒 Session expired. Please login again.";
  if (status === 403)
    return "🚫 You don't have permission to edit this listing.";
  if (status === 404) return "❌ Listing not found.";
  if (status === 409)
    return "⚠️ This listing has been modified by another user.";
  if (status === 429) return "⏳ Too many attempts. Please wait a few minutes.";
  if (status === 500) return "⚠️ Server error. Please try again later.";
  if (!error.response) return "📡 Network error. Please check your connection.";

  return (
    data?.message || data?.error || "❌ Something went wrong. Please try again."
  );
};

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

// Upload new images (now accepts JSON payload with Cloudinary URLs)
const uploadImages = async ({ listingId, images }) => {
  // images is now an array of objects: { url, thumbnail, public_id }
  const { data } = await API.post(`/listings/${listingId}/images`, {
    images: images,
  });
  return data;
};

export default function EditListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const cameraInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    house_type: "studio",
    location: "",
    description: "",
    price: "",
    contact_phone: "",
    latitude: "",
    longitude: "",
    pin_latitude: "",
    pin_longitude: "",
    service_charge: "",
    trash_fee: "",
    water_source: "",
    water_metering: "",
    water_rationing: "",
    power_metering: "",
    backup_power: "",
    has_lift: false,
    has_cctv: false,
    has_balcony: false,
    has_rooftop: false,
    has_parking: false,
    has_fence: false,
    matatu_distance: "",
    matatu_walk_time: "",
    fare_cbd_offpeak: "",
    fare_cbd_peak: "",
    supermarket_distance: "",
    gym_distance: "",
    food_delivery_available: false,
  });

  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [locationStatus, setLocationStatus] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [pinLocation, setPinLocation] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // ============ AUTO-SEARCH LOCATION ON MAP ============
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const searchLocation = async () => {
      if (!formData.location || formData.location.length < 3) return;

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.location)}, Kenya&limit=1`,
        );
        const data = await response.json();

        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          const latNum = parseFloat(lat);
          const lonNum = parseFloat(lon);

          setPinLocation({ latitude: latNum, longitude: lonNum });
          setFormData((prev) => ({
            ...prev,
            pin_latitude: latNum.toString(),
            pin_longitude: lonNum.toString(),
          }));
        }
      } catch (error) {
        console.debug("Location search:", error);
      }
    };

    searchTimeoutRef.current = setTimeout(searchLocation, 1000);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [formData.location]);

  // Fetch existing listing data
  const {
    data: listing,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => fetchListing(id),
    retry: 1,
  });

  // Populate form when data loads
  useEffect(() => {
    if (listing) {
      if (listing.pin_latitude && listing.pin_longitude) {
        setPinLocation({
          latitude: listing.pin_latitude,
          longitude: listing.pin_longitude,
        });
      }

      setFormData({
        title: listing.title || "",
        house_type: listing.house_type || "studio",
        location: listing.location || "",
        description: listing.description || "",
        price: listing.price || "",
        contact_phone: listing.contact_phone || "",
        latitude: listing.latitude || "",
        longitude: listing.longitude || "",
        pin_latitude: listing.pin_latitude || "",
        pin_longitude: listing.pin_longitude || "",
        service_charge: listing.service_charge || "",
        trash_fee: listing.trash_fee || "",
        water_source: listing.water_source || "",
        water_metering: listing.water_metering || "",
        water_rationing: listing.water_rationing || "",
        power_metering: listing.power_metering || "",
        backup_power: listing.backup_power || "",
        has_lift: listing.has_lift || false,
        has_cctv: listing.has_cctv || false,
        has_balcony: listing.has_balcony || false,
        has_rooftop: listing.has_rooftop || false,
        has_parking: listing.has_parking || false,
        has_fence: listing.has_fence || false,
        matatu_distance: listing.matatu_distance || "",
        matatu_walk_time: listing.matatu_walk_time || "",
        fare_cbd_offpeak: listing.fare_cbd_offpeak || "",
        fare_cbd_peak: listing.fare_cbd_peak || "",
        supermarket_distance: listing.supermarket_distance || "",
        gym_distance: listing.gym_distance || "",
        food_delivery_available: listing.food_delivery_available || false,
      });
      setExistingImages(listing.images || []);
    }
  }, [listing]);

  // ============ UPDATE MUTATION ============
  const updateMutation = useMutation({
    mutationFn: updateListing,
    onSuccess: async (data) => {
      // Handle image deletions
      for (const imageId of imagesToDelete) {
        try {
          await deleteImage(imageId);
        } catch (error) {
          const errorMsg = getErrorMessage(error, "delete_image");
          toast.error(errorMsg);
        }
      }

      // Handle new image uploads (direct to Cloudinary then backend)
      if (newImages.length > 0) {
        setIsUploadingImages(true);
        try {
          // Upload each new image directly to Cloudinary
          const uploadedImages = [];
          for (const file of newImages) {
            try {
              const result = await uploadToCloudinary(file);
              uploadedImages.push(result);
            } catch (uploadError) {
              toast.error(
                `❌ Failed to upload ${file.name}: ${uploadError.message}`,
              );
              // Continue with other images
            }
          }

          if (uploadedImages.length === 0) {
            toast.error("❌ No images were uploaded successfully.");
            setIsUploadingImages(false);
            return;
          }

          // Send URLs to backend
          const result = await uploadImages({
            listingId: id,
            images: uploadedImages,
          });

          const rejectedCount = result.rejected_files?.length || 0;
          const uploadedCount = uploadedImages.length;

          if (rejectedCount > 0 && uploadedCount === 0) {
            toast.error(
              `❌ All ${rejectedCount} images were rejected. No new images added.`,
            );
            result.rejected_files.forEach((rejected) => {
              toast.error(`❌ ${rejected.filename}: ${rejected.reason}`);
            });
            setIsUploadingImages(false);
            queryClient.invalidateQueries(["myListings"]);
            queryClient.invalidateQueries(["listing", id]);
            navigate("/dashboard");
            return;
          }

          if (rejectedCount > 0 && uploadedCount > 0) {
            toast.warning(
              `⚠️ ${rejectedCount} image(s) rejected. ${uploadedCount} uploaded successfully.`,
            );
            result.rejected_files.forEach((rejected) => {
              toast.error(`❌ ${rejected.filename}: ${rejected.reason}`);
            });
          }

          if (result.location_warnings?.length > 0) {
            result.location_warnings.forEach((warning) => {
              toast.warning(`⚠️ ${warning.warning}`);
            });
          }
          if (result.location_verified) {
            toast.success("📍 Location verified!");
          }
        } catch (error) {
          const errorMsg = getErrorMessage(error, "upload");
          toast.error(errorMsg);
          setIsUploadingImages(false);
          return;
        }
        setIsUploadingImages(false);
      }

      toast.success("✅ Listing updated successfully!");
      queryClient.invalidateQueries(["myListings"]);
      queryClient.invalidateQueries(["listing", id]);
      navigate("/dashboard");
    },
    onError: (error) => {
      const errorMsg = getErrorMessage(error, "update");
      toast.error(errorMsg);

      if (error.response?.status === 401) {
        navigate("/login");
      }
    },
  });

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Handle pin drop from map
  const handlePinDrop = (location) => {
    setPinLocation(location);
    setFormData((prev) => ({
      ...prev,
      pin_latitude: location.latitude.toString(),
      pin_longitude: location.longitude.toString(),
    }));
    setValidationErrors((prev) => ({ ...prev, pin_location: null }));
    toast.success("📍 Pin updated on map!");
  };

  // Validate form before submission
  const validateForm = () => {
    const errors = {};

    if (!formData.house_type) {
      errors.house_type = "🏠 Please select a property type.";
    }

    if (!formData.location || formData.location.length < 2) {
      errors.location = "📍 Please enter a valid location.";
    }

    if (formData.price && isNaN(parseFloat(formData.price))) {
      errors.price = "💰 Please enter a valid price.";
    }

    if (formData.price && parseFloat(formData.price) < 0) {
      errors.price = "💰 Price cannot be negative.";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstError = Object.values(validationErrors)[0];
      if (firstError) {
        toast.error(firstError);
      }
      return;
    }

    // Clean up form data
    const cleanedData = {};
    for (const [key, value] of Object.entries(formData)) {
      if (value === "" || value === null || value === undefined) {
        cleanedData[key] = null;
      } else if (typeof value === "string" && value.trim() === "") {
        cleanedData[key] = null;
      } else {
        cleanedData[key] = value;
      }
    }

    // Ensure numeric fields are properly parsed
    const numericFields = [
      "price",
      "service_charge",
      "trash_fee",
      "matatu_distance",
      "matatu_walk_time",
      "fare_cbd_offpeak",
      "fare_cbd_peak",
      "supermarket_distance",
      "gym_distance",
      "latitude",
      "longitude",
      "pin_latitude",
      "pin_longitude",
    ];
    numericFields.forEach((field) => {
      if (cleanedData[field] !== null && cleanedData[field] !== undefined) {
        cleanedData[field] = parseFloat(cleanedData[field]);
      }
    });

    updateMutation.mutate({ id, ...cleanedData });
  };

  // Remove existing image
  const removeExistingImage = (image) => {
    setImagesToDelete([...imagesToDelete, image.id]);
    setExistingImages(existingImages.filter((img) => img.id !== image.id));
  };

  // ============ CAMERA CAPTURE ============
  const handleCameraCapture = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.target.files[0];
    if (!file) {
      console.log("No file selected");
      e.target.value = "";
      return;
    }

    console.log("📸 File captured:", file.name, file.type, file.size);

    if (!file.type.startsWith("image/")) {
      toast.error("📸 Please select an image file.");
      e.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("📸 Image exceeds 10MB limit.");
      e.target.value = "";
      return;
    }

    const loadingToastId = toast.loading("Processing photo...");

    let deviceLat = null;
    let deviceLon = null;

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 30000,
        });
      });

      deviceLat = position.coords.latitude;
      deviceLon = position.coords.longitude;

      console.log("📍 GPS detected:", deviceLat, deviceLon);
      setFormData((prev) => ({
        ...prev,
        latitude: deviceLat.toString(),
        longitude: deviceLon.toString(),
      }));
      setLocationStatus({
        success: true,
        message: `📍 Location detected: ${deviceLat.toFixed(6)}, ${deviceLon.toFixed(6)}`,
      });
      toast.success("📍 Location detected!", { id: loadingToastId });
    } catch (error) {
      console.warn("⚠️ GPS error:", error.message);
      setLocationStatus({
        success: false,
        message: "⚠️ Could not get GPS location. Using pin if available.",
      });
      toast.warning("⚠️ GPS not available. Using pin if set.", {
        id: loadingToastId,
      });
    }

    // Add file to newImages state (will be uploaded on submit)
    setNewImages([...newImages, file]);
    const preview = {
      url: URL.createObjectURL(file),
      name: file.name || "Camera photo",
      isCamera: true,
    };
    setNewImagePreviews([...newImagePreviews, preview]);

    toast.success("📸 Photo captured!", { id: loadingToastId });
    e.target.value = "";
  };

  const openCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    const errorMsg = getErrorMessage(error, "fetch");
    toast.error(errorMsg);

    return (
      <div className="text-center py-12">
        <p className="text-red-400">{errorMsg}</p>
        <div className="flex justify-center gap-3 mt-4">
          <button onClick={() => refetch()} className="btn-primary">
            Retry
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="btn-outline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">❌ Listing not found</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="btn-primary mt-4"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const totalImages = existingImages.length + newImages.length;
  const isSubmitting = updateMutation.isPending || isUploadingImages;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-4 sm:p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-6 heading-gradient">
          Edit Listing
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ============ BASIC INFO ============ */}
          <div className="border-b border-white/10 pb-6">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">
              Basic Information
            </h2>

            <SafetyTip page="edit_listing" className="mb-4" />

            {/* House Type */}
            <div>
              <label className="label">Property Type *</label>
              <select
                name="house_type"
                value={formData.house_type}
                onChange={handleChange}
                className={`input ${validationErrors.house_type ? "border-red-500/50 focus:border-red-500" : ""}`}
                required
              >
                {HOUSE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {validationErrors.house_type && (
                <p className="text-red-400 text-[10px] mt-1">
                  {validationErrors.house_type}
                </p>
              )}
            </div>

            {/* Title */}
            <div className="mt-4">
              <label className="label">Title (Optional)</label>
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
            <div className="mt-4">
              <label className="label">Location *</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Kilimani, Nairobi"
                className={`input ${validationErrors.location ? "border-red-500/50 focus:border-red-500" : ""}`}
                required
              />
              <p className="text-[10px] text-gray-500 mt-1">
                💡 The map below will automatically search for this location
              </p>
              {validationErrors.location && (
                <p className="text-red-400 text-[10px] mt-1">
                  {validationErrors.location}
                </p>
              )}
            </div>

            {/* Hidden GPS fields */}
            <input type="hidden" name="latitude" value={formData.latitude} />
            <input type="hidden" name="longitude" value={formData.longitude} />

            {/* Location Status */}
            {locationStatus && (
              <div
                className={`mt-4 p-3 rounded-lg text-sm ${
                  locationStatus.success
                    ? "bg-green-500/10 border border-green-500/30 text-green-400"
                    : "bg-yellow-500/10 border border-yellow-500/30 text-yellow-400"
                }`}
              >
                {locationStatus.message}
              </div>
            )}
            {isGettingLocation && (
              <div className="mt-4 p-3 rounded-lg text-sm bg-blue-500/10 border border-blue-500/30 text-blue-400">
                📡 Getting your location...
              </div>
            )}

            {/* Description */}
            <div className="mt-4">
              <label className="label">Description</label>
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
            <div className="mt-4">
              <label className="label">Price (KSh per month)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="e.g., 25000"
                className={`input ${validationErrors.price ? "border-red-500/50 focus:border-red-500" : ""}`}
              />
              {validationErrors.price && (
                <p className="text-red-400 text-[10px] mt-1">
                  {validationErrors.price}
                </p>
              )}
            </div>

            {/* Contact Phone */}
            <div className="mt-4">
              <label className="label">Contact Phone (Optional)</label>
              <input
                type="tel"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                placeholder="Leave blank to use your registered number"
                className="input"
              />
            </div>
          </div>

          {/* ============ MAP PICKER ============ */}
          <div className="border-b border-white/10 pb-6">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">
              📍 Property Location on Map
            </h2>
            <p className="text-xs text-gray-400 mb-3">
              Click on the map to update the property location pin.
              {pinLocation && (
                <span className="text-green-400 ml-1">
                  ✅ Current pin: {pinLocation.latitude.toFixed(6)},{" "}
                  {pinLocation.longitude.toFixed(6)}
                </span>
              )}
            </p>
            <MapPicker
              onLocationSelect={handlePinDrop}
              initialCenter={
                pinLocation
                  ? [pinLocation.latitude, pinLocation.longitude]
                  : [
                      listing.latitude || -1.286389,
                      listing.longitude || 36.817223,
                    ]
              }
              initialZoom={15}
              height="350px"
              setPinLocation={setPinLocation}
              isVerified={!!pinLocation}
              showSearch={true}
            />
            {pinLocation && (
              <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-xs text-green-400">
                  ✅ Pin updated at: {pinLocation.latitude.toFixed(6)},{" "}
                  {pinLocation.longitude.toFixed(6)}
                </p>
              </div>
            )}
            {!pinLocation && (
              <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-xs text-yellow-400">
                  ⚠️ No pin set. Drop a pin on the map to mark the property
                  location.
                </p>
                {validationErrors.pin_location && (
                  <p className="text-red-400 text-[10px] mt-1">
                    {validationErrors.pin_location}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ============ UTILITY & FEE BREAKDOWN ============ */}
          <div className="border-b border-white/10 pb-6">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">
              Utility & Fee Breakdown
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Service Charge (KSh)</label>
                <input
                  type="number"
                  name="service_charge"
                  value={formData.service_charge}
                  onChange={handleChange}
                  placeholder="e.g., 5000"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Trash Fee (KSh)</label>
                <input
                  type="number"
                  name="trash_fee"
                  value={formData.trash_fee}
                  onChange={handleChange}
                  placeholder="e.g., 1000"
                  className="input"
                />
              </div>
            </div>
            <p className="text-[10px] text-gray-500 mt-2">
              💰 Total monthly cost = Rent + Service Charge + Trash Fee
            </p>
          </div>

          {/* ============ WATER MATRIX ============ */}
          <div className="border-b border-white/10 pb-6">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">
              💧 Water Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Water Source</label>
                <select
                  name="water_source"
                  value={formData.water_source}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Select source</option>
                  {WATER_SOURCES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Water Metering</label>
                <select
                  name="water_metering"
                  value={formData.water_metering}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Select metering</option>
                  {WATER_METERING.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Water Rationing</label>
                <select
                  name="water_rationing"
                  value={formData.water_rationing}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Select rationing schedule</option>
                  {WATER_RATIONING.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ============ POWER MATRIX ============ */}
          <div className="border-b border-white/10 pb-6">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">
              ⚡ Power Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Power Metering</label>
                <select
                  name="power_metering"
                  value={formData.power_metering}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Select metering</option>
                  {POWER_METERING.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Backup Power</label>
                <select
                  name="backup_power"
                  value={formData.backup_power}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Select backup</option>
                  {BACKUP_POWER.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ============ BUILDING FEATURES ============ */}
          <div className="border-b border-white/10 pb-6">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">
              🏢 Building Features
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  name="has_lift"
                  checked={formData.has_lift}
                  onChange={handleChange}
                  className="w-4 h-4 accent-blue-500"
                />
                Elevator/Lift
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  name="has_cctv"
                  checked={formData.has_cctv}
                  onChange={handleChange}
                  className="w-4 h-4 accent-blue-500"
                />
                CCTV
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  name="has_balcony"
                  checked={formData.has_balcony}
                  onChange={handleChange}
                  className="w-4 h-4 accent-blue-500"
                />
                Balcony
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  name="has_rooftop"
                  checked={formData.has_rooftop}
                  onChange={handleChange}
                  className="w-4 h-4 accent-blue-500"
                />
                Rooftop Access
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  name="has_parking"
                  checked={formData.has_parking}
                  onChange={handleChange}
                  className="w-4 h-4 accent-blue-500"
                />
                Dedicated Parking
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  name="has_fence"
                  checked={formData.has_fence}
                  onChange={handleChange}
                  className="w-4 h-4 accent-blue-500"
                />
                Perimeter Fence
              </label>
            </div>
          </div>

          {/* ============ COMMUTE & LOGISTICS ============ */}
          <div className="border-b border-white/10 pb-6">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">
              🚌 Commute & Logistics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Distance to Matatu (meters)</label>
                <input
                  type="number"
                  name="matatu_distance"
                  value={formData.matatu_distance}
                  onChange={handleChange}
                  placeholder="e.g., 200"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Walk Time to Matatu (minutes)</label>
                <input
                  type="number"
                  name="matatu_walk_time"
                  value={formData.matatu_walk_time}
                  onChange={handleChange}
                  placeholder="e.g., 3"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Fare to CBD (Off-peak)</label>
                <input
                  type="number"
                  name="fare_cbd_offpeak"
                  value={formData.fare_cbd_offpeak}
                  onChange={handleChange}
                  placeholder="e.g., 100"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Fare to CBD (Peak)</label>
                <input
                  type="number"
                  name="fare_cbd_peak"
                  value={formData.fare_cbd_peak}
                  onChange={handleChange}
                  placeholder="e.g., 150"
                  className="input"
                />
              </div>
              <div>
                <label className="label">
                  Distance to Supermarket (meters)
                </label>
                <input
                  type="number"
                  name="supermarket_distance"
                  value={formData.supermarket_distance}
                  onChange={handleChange}
                  placeholder="e.g., 500"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Distance to Gym (meters)</label>
                <input
                  type="number"
                  name="gym_distance"
                  value={formData.gym_distance}
                  onChange={handleChange}
                  placeholder="e.g., 800"
                  className="input"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    name="food_delivery_available"
                    checked={formData.food_delivery_available}
                    onChange={handleChange}
                    className="w-4 h-4 accent-blue-500"
                  />
                  Food Delivery Available (Bolt/Uber Eats)
                </label>
              </div>
            </div>
          </div>

          {/* ============ EXISTING IMAGES ============ */}
          {existingImages.length > 0 && (
            <div className="border-b border-white/10 pb-6">
              <label className="label">
                Current Images ({existingImages.length})
              </label>
              <div className="grid grid-cols-4 gap-3 mt-2">
                {existingImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.thumbnail}
                      alt="Listing"
                      className="w-full h-24 object-cover rounded-lg border border-white/10"
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

          {/* ============ ADD MORE IMAGES - CAMERA ONLY ============ */}
          <div>
            <label className="label">
              {totalImages > 0 ? "Add More Photos" : "Take Photos"}
              <span className="text-xs text-red-400 ml-2">
                ({totalImages}/10) - Camera only
              </span>
            </label>

            <SafetyTip page="image_upload" className="mb-4" />

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleCameraCapture}
            />

            <div className="border-2 border-dashed border-white/15 rounded-xl p-6 text-center bg-black/30">
              <CameraIcon className="w-12 h-12 text-blue-400 mx-auto mb-3" />
              <p className="text-white font-medium">
                Take a Photo at the Property
              </p>
              <p className="text-gray-400 text-sm mt-1">
                You must be at the property location to take photos
              </p>
              <button
                type="button"
                onClick={openCamera}
                className="btn-primary inline-flex items-center gap-2 mt-4"
              >
                <CameraIcon className="w-5 h-5" />
                Open Camera
              </button>
            </div>

            {/* New Image Previews */}
            {newImagePreviews.length > 0 && (
              <div className="mt-4">
                <div className="grid grid-cols-4 gap-3">
                  {newImagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview.url}
                        alt={preview.name}
                        className="w-full h-24 object-cover rounded-lg border border-white/10"
                      />
                      <span className="absolute top-1 left-1 bg-blue-500/80 text-white text-[8px] px-1.5 py-0.5 rounded">
                        📸 Camera
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          URL.revokeObjectURL(newImagePreviews[index].url);
                          const updatedImages = [...newImages];
                          updatedImages.splice(index, 1);
                          setNewImages(updatedImages);
                          const updatedPreviews = [...newImagePreviews];
                          updatedPreviews.splice(index, 1);
                          setNewImagePreviews(updatedPreviews);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Location Notice */}
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
            <p className="text-sm text-blue-300 flex items-start gap-2">
              <span className="text-lg">📍</span>
              <span>
                <strong>Location Verification:</strong> Drop a pin on the map to
                mark the property location. When you take a photo with your
                camera, the GPS location is embedded in the photo. The system
                will verify you are at the property location. Photos without GPS
                data will use the pin location as fallback.
              </span>
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
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
              {isSubmitting ? "Saving..." : "💾 Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
