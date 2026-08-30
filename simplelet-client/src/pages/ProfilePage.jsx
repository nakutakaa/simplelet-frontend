// src/pages/ProfilePage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import API from "../services/api";
import SafetyTip from "../components/SafetyTip";

// ============ ERROR MESSAGES ============
const getErrorMessage = (error, context = "profile") => {
  const status = error.response?.status;
  const data = error.response?.data;
  const errorCode = data?.error_code || data?.error || "";

  const errorMap = {
    // Profile update errors
    name_required: "👤 Name is required.",
    name_too_short: "👤 Name must be at least 2 characters.",
    invalid_phone: "📱 Invalid phone format.",
    phone_exists: "📱 This phone number is already in use.",
    update_failed: "❌ Failed to update profile. Please try again.",

    // Password errors
    current_password_required: "🔑 Please enter your current password.",
    current_password_incorrect: "🔑 Current password is incorrect.",
    new_password_required: "🔑 Please enter a new password.",
    new_password_too_short: "🔑 Password must be at least 6 characters.",
    passwords_do_not_match: "🔑 Passwords do not match.",
    same_password: "🔑 New password must be different from current password.",
    password_change_failed: "❌ Failed to change password. Please try again.",

    // Delete account errors
    delete_password_required:
      "🔑 Please enter your password to delete your account.",
    delete_password_incorrect:
      "🔑 Incorrect password. Account deletion failed.",
    delete_failed: "❌ Failed to delete account. Please try again.",
    delete_confirmation_failed:
      "❌ Account deletion failed. Please contact support.",

    // Session errors
    unauthorized: "🔒 Session expired. Please login again.",
    forbidden: "🚫 You don't have permission to perform this action.",

    // Network errors
    network_error: "📡 Network error. Please check your connection.",
    server_error: "⚠️ Server error. Please try again later.",
  };

  // Check for specific error codes first
  if (errorCode && errorMap[errorCode]) {
    return errorMap[errorCode];
  }

  // Check by HTTP status
  if (status === 400) return "⚠️ Please check your information and try again.";
  if (status === 401) return "🔒 Session expired. Please login again.";
  if (status === 403)
    return "🚫 You don't have permission to perform this action.";
  if (status === 404) return "❌ Resource not found.";
  if (status === 409) return "📱 This phone number is already in use.";
  if (status === 500) return "⚠️ Server error. Please try again later.";
  if (!error.response) return "📡 Network error. Please check your connection.";

  return (
    data?.message || data?.error || "❌ Something went wrong. Please try again."
  );
};

const fetchProfile = async () => {
  const { data } = await API.get("/user/profile"); // Updated from /auth/me
  return data;
};

const updateProfile = async (updates) => {
  const { data } = await API.put("/user/profile", updates);
  return data;
};

const changePassword = async (passwords) => {
  const { data } = await API.post("/user/change-password", passwords);
  return data;
};

const deleteAccount = async (password) => {
  const { data } = await API.delete("/user/account", { data: { password } });
  return data;
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "" });
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [deletePassword, setDeletePassword] = useState("");

  // Fetch profile
  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    retry: 1,
  });

  // Populate form when user loads
  useEffect(() => {
    if (user) {
      setFormData({ name: user.name || "", phone: user.phone || "" });
    }
  }, [user]);

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      toast.success("✅ Profile updated successfully!");
      queryClient.invalidateQueries(["profile"]);
      queryClient.invalidateQueries(["userProfile"]);
      setIsEditing(false);
      refetch();
    },
    onError: (error) => {
      const errorMsg = getErrorMessage(error, "update");
      toast.error(errorMsg);

      if (error.response?.status === 401) {
        navigate("/login");
      }
    },
  });

  // Change password mutation
  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success("🔑 Password changed successfully!");
      setIsChangingPassword(false);
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      // Clear password fields
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    },
    onError: (error) => {
      const errorMsg = getErrorMessage(error, "password");
      toast.error(errorMsg);

      // Clear password fields on error
      setPasswordData({
        ...passwordData,
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    },
  });

  // Delete account mutation
  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      toast.success("🗑️ Account deleted successfully");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/");
    },
    onError: (error) => {
      const errorMsg = getErrorMessage(error, "delete");
      toast.error(errorMsg);
      setDeletePassword("");

      if (error.response?.status === 401) {
        // Wrong password or session expired
        toast.error("🔑 Incorrect password. Please try again.");
      }
    },
  });

  const handleEditSubmit = (e) => {
    e.preventDefault();

    // Client-side validation
    if (!formData.name.trim()) {
      toast.error("👤 Name is required.");
      return;
    }
    if (formData.name.length < 2) {
      toast.error("👤 Name must be at least 2 characters.");
      return;
    }

    updateMutation.mutate({ name: formData.name.trim() });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();

    // Client-side validation
    if (!passwordData.current_password) {
      toast.error("🔑 Please enter your current password.");
      return;
    }
    if (!passwordData.new_password) {
      toast.error("🔑 Please enter a new password.");
      return;
    }
    if (passwordData.new_password.length < 6) {
      toast.error("🔑 Password must be at least 6 characters.");
      return;
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("🔑 Passwords do not match. Please try again.");
      return;
    }
    if (passwordData.new_password === passwordData.current_password) {
      toast.error("🔑 New password must be different from current password.");
      return;
    }

    passwordMutation.mutate({
      current_password: passwordData.current_password,
      new_password: passwordData.new_password,
    });
  };

  const handleDeleteSubmit = (e) => {
    e.preventDefault();

    if (!deletePassword) {
      toast.error("🔑 Please enter your password to confirm deletion.");
      return;
    }

    // Final confirmation
    if (
      !window.confirm(
        "⚠️ Are you SURE you want to delete your account?\n\n" +
          "This action is PERMANENT and cannot be undone.\n" +
          "All your listings, comments, and data will be lost forever.",
      )
    ) {
      return;
    }

    deleteMutation.mutate(deletePassword);
  };

  // Handle session expiration
  if (error) {
    if (error.response?.status === 401) {
      toast.error("🔒 Session expired. Please login again.");
      navigate("/login");
      return null;
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">❌ Failed to load profile</p>
        <button onClick={() => refetch()} className="btn-primary mt-4">
          Retry
        </button>
        <button onClick={() => navigate("/")} className="btn-outline mt-2 ml-2">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-4 sm:p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-2 heading-gradient">
          My Profile
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          Manage your account settings and preferences
        </p>

        {/* ============ SAFETY TIP ============ */}
        <SafetyTip page="contact" className="mb-6" />

        {/* Profile Info */}
        <div className="space-y-4">
          {!isEditing ? (
            <>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-sm">Name</p>
                  <p className="text-lg font-medium text-white">{user.name}</p>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm text-blue-400 hover:text-blue-300 transition"
                >
                  Edit
                </button>
              </div>

              <div>
                <p className="text-gray-400 text-sm">Phone</p>
                <p className="text-lg font-medium text-white">{user.phone}</p>
                {user.is_verified ? (
                  <span className="text-xs text-green-400">✅ Verified</span>
                ) : (
                  <span className="text-xs text-yellow-400">
                    ⏳ Not verified
                  </span>
                )}
              </div>

              <div>
                <p className="text-gray-400 text-sm">Member Since</p>
                <p className="text-lg font-medium text-white">
                  {new Date(user.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </>
          ) : (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input"
                  required
                  placeholder="Enter your full name"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  This will be displayed on your listings
                </p>
              </div>
              <div>
                <label className="label">Phone (Cannot be changed here)</label>
                <input
                  type="text"
                  value={formData.phone}
                  className="input bg-black/50 cursor-not-allowed border-white/5"
                  disabled
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Contact support to change phone number
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Saving..." : "💾 Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: user.name || "",
                      phone: user.phone || "",
                    });
                  }}
                  className="btn-outline"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Change Password Section */}
        <div className="border-t border-white/10 mt-6 pt-6">
          <button
            onClick={() => setIsChangingPassword(!isChangingPassword)}
            className="text-blue-400 hover:text-blue-300 transition text-sm"
          >
            {isChangingPassword ? "Cancel" : "🔑 Change Password"}
          </button>

          {isChangingPassword && (
            <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
              <div>
                <label className="label">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.current_password}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        current_password: e.target.value,
                      })
                    }
                    className="input pr-10"
                    required
                    placeholder="Enter your current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition"
                  >
                    {showCurrentPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.new_password}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        new_password: e.target.value,
                      })
                    }
                    className="input pr-10"
                    required
                    placeholder="Enter new password (min 6 chars)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition"
                  >
                    {showNewPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  Minimum 6 characters, at least 1 number
                </p>
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirm_password}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirm_password: e.target.value,
                      })
                    }
                    className="input pr-10"
                    required
                    placeholder="Confirm your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition"
                  >
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={passwordMutation.isPending}
              >
                {passwordMutation.isPending
                  ? "Changing..."
                  : "🔑 Change Password"}
              </button>
            </form>
          )}
        </div>

        {/* Delete Account Section */}
        <div className="border-t border-white/10 mt-6 pt-6">
          <button
            onClick={() => setIsDeleting(!isDeleting)}
            className="text-red-400 hover:text-red-300 transition text-sm"
          >
            {isDeleting ? "Cancel" : "🗑️ Delete Account"}
          </button>

          {isDeleting && (
            <form
              onSubmit={handleDeleteSubmit}
              className="mt-4 space-y-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
            >
              <div className="flex items-start gap-2">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="text-sm text-red-400 font-medium">
                    Warning: This will permanently delete:
                  </p>
                  <ul className="text-xs text-red-400/80 list-disc list-inside mt-1">
                    <li>Your account and profile information</li>
                    <li>All your property listings</li>
                    <li>All your comments and reviews</li>
                    <li>Your saved favorites and preferences</li>
                  </ul>
                  <p className="text-xs text-red-400 mt-2 font-medium">
                    This action cannot be undone!
                  </p>
                </div>
              </div>
              <div>
                <label className="label">Enter your password to confirm</label>
                <div className="relative">
                  <input
                    type={showDeletePassword ? "text" : "password"}
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="input pr-10"
                    required
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition"
                  >
                    {showDeletePassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium py-2 px-4 rounded-xl transition-all duration-300 shadow-lg shadow-red-500/20 hover:shadow-red-500/30 disabled:opacity-50"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending
                  ? "Deleting..."
                  : "🗑️ Permanently Delete Account"}
              </button>
            </form>
          )}
        </div>

        {/* Stats Section */}
        <div className="border-t border-white/10 mt-6 pt-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">
            📊 Account Stats
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-black/50 rounded-xl p-3 text-center border border-white/5">
              <p className="text-2xl font-bold text-white">
                {user.total_listings || 0}
              </p>
              <p className="text-[10px] text-gray-500">Listings</p>
            </div>
            <div className="bg-black/50 rounded-xl p-3 text-center border border-white/5">
              <p className="text-2xl font-bold text-white">
                {user.total_reviews || 0}
              </p>
              <p className="text-[10px] text-gray-500">Reviews</p>
            </div>
            <div className="bg-black/50 rounded-xl p-3 text-center border border-white/5">
              <p className="text-2xl font-bold text-white">
                {user.credibility_score || 50}
              </p>
              <p className="text-[10px] text-gray-500">Credibility</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
