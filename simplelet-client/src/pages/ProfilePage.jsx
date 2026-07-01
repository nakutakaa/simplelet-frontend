// src/pages/ProfilePage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import API from "../services/api";

const fetchProfile = async () => {
  const { data } = await API.get("/auth/me");
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
  } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
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
      toast.success("Profile updated successfully!");
      queryClient.invalidateQueries(["profile"]);
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to update profile");
    },
  });

  // Change password mutation
  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success("Password changed successfully!");
      setIsChangingPassword(false);
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to change password");
    },
  });

  // Delete account mutation
  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      toast.success("Account deleted successfully");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to delete account");
    },
  });

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    updateMutation.mutate({ name: formData.name.trim() });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }
    if (passwordData.new_password.length < 6) {
      toast.error("Password must be at least 6 characters");
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
      toast.error("Please enter your password to confirm");
      return;
    }
    if (
      window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone!",
      )
    ) {
      deleteMutation.mutate(deletePassword);
    }
  };

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
        <p className="text-red-400">Failed to load profile</p>
        <button onClick={() => navigate("/")} className="btn-primary mt-4">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-4 sm:p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-6 heading-gradient">
          My Profile
        </h1>

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
                  <span className="text-xs text-green-400">✓ Verified</span>
                ) : (
                  <span className="text-xs text-yellow-400">Not verified</span>
                )}
              </div>

              <div>
                <p className="text-gray-400 text-sm">Member Since</p>
                <p className="text-lg font-medium text-white">
                  {new Date(user.created_at).toLocaleDateString()}
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
                />
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
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
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
            {isChangingPassword ? "Cancel" : "Change Password"}
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
                  Minimum 6 characters
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
                {passwordMutation.isPending ? "Changing..." : "Change Password"}
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
            {isDeleting ? "Cancel" : "Delete Account"}
          </button>

          {isDeleting && (
            <form
              onSubmit={handleDeleteSubmit}
              className="mt-4 space-y-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
            >
              <p className="text-sm text-red-400 font-medium">
                ⚠️ Warning: This will permanently delete your account, all
                listings, and comments.
              </p>
              <div>
                <label className="label">Enter your password to confirm</label>
                <div className="relative">
                  <input
                    type={showDeletePassword ? "text" : "password"}
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="input pr-10"
                    required
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
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium py-2 px-4 rounded-xl transition-all duration-300 shadow-lg shadow-red-500/20 hover:shadow-red-500/30"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending
                  ? "Deleting..."
                  : "Permanently Delete Account"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
