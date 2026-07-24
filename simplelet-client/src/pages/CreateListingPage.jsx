// src/pages/CreateListingPage.jsx
import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import API from "../services/api";
import { XMarkIcon, PhotoIcon, CameraIcon } from "@heroicons/react/24/outline";
import MapPicker from "../components/MapPicker";

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

// Delete listing (rollback)
const deleteListing = async (listingId) => {
  const { data } = await API.delete(`/listings/${listingId}`);
  return data;
};

export default function CreateListingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const cameraInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const [listingId, setListingId] = useState(null);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [pinLocation, setPinLocation] = useState(null);
  const [formData, setFormData] = useState({
    // Existing fields
    title: "",
    house_type: "studio",
    location: "",
    description: "",
    price: "",
    contact_phone: "",
    latitude: "",
    longitude: "",
    // ============ NEW: Pin Location Fields ============
    pin_latitude: "",
    pin_longitude: "",
    // ============ Layer 1 Fields ============
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

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [locationStatus, setLocationStatus] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // ============ AUTO-SEARCH LOCATION ON MAP ============
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const searchLocation = async () => {
      // Only search if location has at least 3 characters
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
        // Silent fail - user can still drop pin manually
        console.debug("Location search:", error);
      }
    };

    // Debounce: wait 1 second after user stops typing
    searchTimeoutRef.current = setTimeout(searchLocation, 1000);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [formData.location]);

  // ============ DELETE LISTING (ROLLBACK) ============
  const deleteMutation = useMutation({
    mutationFn: deleteListing,
    onSuccess: () => {
      setIsRollingBack(false);
      toast.error("❌ Listing creation failed. Please try again.");
    },
    onError: () => {
      setIsRollingBack(false);
      toast.error(
        "⚠️ Images failed to upload and we couldn't rollback the listing. Please contact support.",
      );
    },
  });

  // ============ CREATE LISTING ============
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

  // ============ UPLOAD IMAGES ============
  const uploadMutation = useMutation({
    mutationFn: uploadImages,
    onSuccess: (data) => {
      // Check if any images were rejected
      const rejectedCount = data.rejected_files?.length || 0;
      const uploadedCount = data.uploaded?.length || 0;

      if (rejectedCount > 0 && uploadedCount === 0) {
        // ALL images rejected - rollback listing
        toast.error("❌ All images were rejected. Rolling back listing...");
        setIsRollingBack(true);
        deleteMutation.mutate(listingId);
        return;
      }

      if (rejectedCount > 0 && uploadedCount > 0) {
        // Some images rejected, some uploaded - show warning but keep listing
        toast.error(
          `⚠️ ${rejectedCount} image(s) were rejected. ${uploadedCount} uploaded successfully.`,
        );
        // Show detailed rejection reasons
        data.rejected_files.forEach((rejected) => {
          toast.error(`❌ ${rejected.filename}: ${rejected.reason}`);
        });
      }

      // Show location status
      if (data.location_warnings && data.location_warnings.length > 0) {
        const warning = data.location_warnings[0];
        toast.error(`⚠️ ${warning.warning}`);
      }
      if (data.location_verified) {
        toast.success("📍 Location verified!");
      }

      toast.success(`✅ Listing created with ${uploadedCount} images!`);
      queryClient.invalidateQueries(["myListings"]);
      navigate("/dashboard");
    },
    onError: (error) => {
      // Images failed to upload - rollback listing
      const errorMsg = error.response?.data?.error || "Images upload failed";
      toast.error(`❌ ${errorMsg}. Rolling back listing...`);
      setIsRollingBack(true);
      deleteMutation.mutate(listingId);
    },
  });

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle pin drop from map
  const handlePinDrop = (location) => {
    console.log("📍 Pin dropped:", location);
    setPinLocation(location);
    setFormData((prev) => ({
      ...prev,
      pin_latitude: location.latitude.toString(),
      pin_longitude: location.longitude.toString(),
    }));
    toast.success("📍 Pin placed on map!");
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.house_type || !formData.location) {
      toast.error("House type and location are required");
      return;
    }

    if (formData.price && isNaN(parseFloat(formData.price))) {
      toast.error("Price must be a number");
      return;
    }

    if (images.length === 0) {
      toast.error("Please take at least one photo at the property");
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

    createMutation.mutate(cleanedData);
  };

  // ============ CAMERA CAPTURE - FIXED ============
  const handleCameraCapture = async (e) => {
    // Prevent any default behavior that might cause page reload
    e.preventDefault();
    e.stopPropagation();

    const file = e.target.files[0];
    if (!file) {
      console.log("No file selected");
      e.target.value = "";
      return;
    }

    console.log("📸 File captured:", file.name, file.type, file.size);

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      e.target.value = "";
      return;
    }

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image exceeds 10MB limit");
      e.target.value = "";
      return;
    }

    // Show loading state
    const loadingToastId = toast.loading("Processing photo...");

    // Try to get GPS from device
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
        message:
          "⚠️ Could not get GPS location. Using pin location if available.",
      });
      toast.error("⚠️ GPS not available. Using pin if set.", {
        id: loadingToastId,
      });
    }

    // Add the image to state
    setImages((prev) => [...prev, file]);
    const preview = {
      url: URL.createObjectURL(file),
      name: file.name || "Camera photo",
      isCamera: true,
    };
    setImagePreviews((prev) => [...prev, preview]);

    toast.success("📸 Photo captured!", { id: loadingToastId });

    // Reset the input so the same file can be captured again
    e.target.value = "";
  };

  const openCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index].url);

    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);

    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);

    if (newImages.length === 0) {
      setLocationStatus(null);
    }
  };

  const isSubmitting =
    createMutation.isPending || uploadMutation.isPending || isRollingBack;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-4 sm:p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-6 heading-gradient">
          Post a New Listing
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ============ BASIC INFO ============ */}
          <div className="border-b border-white/10 pb-6">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">
              Basic Information
            </h2>

            {/* House Type */}
            <div>
              <label className="label">Property Type *</label>
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
              <p className="text-[10px] text-gray-500 mt-1">
                Leave blank to auto-generate from property type and location
              </p>
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
                className="input"
                required
              />
              <p className="text-[10px] text-gray-500 mt-1">
                💡 The map below will automatically search for this location
              </p>
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
                placeholder="Describe the property, amenities, nearby facilities..."
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
                className="input"
              />
              <p className="text-[10px] text-gray-500 mt-1">
                Leave blank if price is negotiable
              </p>
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
              📍 Drop a Pin on the Property Location
            </h2>
            <p className="text-xs text-gray-400 mb-3">
              Click on the map to mark exactly where the property is located.
              This helps renters find the exact location and verifies your
              listing.
              <span className="text-yellow-400 ml-1">
                ⚠️ Required: Drop a pin to help verify your location.
              </span>
            </p>
            <MapPicker
              onLocationSelect={handlePinDrop}
              initialZoom={15}
              height="350px"
              setPinLocation={setPinLocation}
              isVerified={!!pinLocation}
              showSearch={true}
            />
            {pinLocation && (
              <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-xs text-green-400">
                  ✅ Pin dropped at: {pinLocation.latitude.toFixed(6)},{" "}
                  {pinLocation.longitude.toFixed(6)}
                </p>
              </div>
            )}
            {!pinLocation && (
              <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-xs text-yellow-400">
                  ⚠️ Please drop a pin on the map to mark the property location
                </p>
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

          {/* ============ IMAGE UPLOAD ============ */}
          <div>
            <label className="label">
              📸 Take Photos of the Property
              <span className="text-xs text-red-400 ml-2">
                * Camera only - No gallery uploads
              </span>
            </label>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleCameraCapture}
            />

            <div className="border-2 border-dashed border-white/15 rounded-xl p-8 text-center bg-black/30">
              <CameraIcon className="w-16 h-16 text-blue-400 mx-auto mb-3" />
              <p className="text-white font-medium text-lg">
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
              <p className="text-[10px] text-gray-500 mt-3">
                Photos will be watermarked with your details and location
                verified
              </p>
            </div>

            {imagePreviews.length > 0 && (
              <div className="mt-4">
                <div className="grid grid-cols-4 gap-3">
                  {imagePreviews.map((preview, index) => (
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
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-500 mt-2">
                  {images.length} / 10 photos captured with camera
                </p>
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

          {/* Submit Button */}
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
              disabled={isSubmitting || images.length === 0 || !pinLocation}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {isSubmitting
                ? isRollingBack
                  ? "Rolling back..."
                  : "Creating..."
                : `Post Listing (${images.length} photos)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
