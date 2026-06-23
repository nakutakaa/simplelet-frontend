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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Failed to load profile</p>
        <button onClick={() => navigate("/")} className="btn-primary mt-4">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-6">My Profile</h1>

        {/* Profile Info */}
        <div className="space-y-4">
          {!isEditing ? (
            <>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="text-lg font-medium">{user.name}</p>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm text-primary-600 hover:underline"
                >
                  Edit
                </button>
              </div>

              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-lg font-medium">{user.phone}</p>
                {user.is_verified ? (
                  <span className="text-xs text-green-600">✓ Verified</span>
                ) : (
                  <span className="text-xs text-yellow-600">Not verified</span>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="text-lg font-medium">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </>
          ) : (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone (Cannot be changed here)
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  className="input bg-gray-100 cursor-not-allowed"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
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
        <div className="border-t border-gray-200 mt-6 pt-6">
          <button
            onClick={() => setIsChangingPassword(!isChangingPassword)}
            className="text-primary-600 hover:underline text-sm"
          >
            {isChangingPassword ? "Cancel" : "Change Password"}
          </button>

          {isChangingPassword && (
            <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      current_password: e.target.value,
                    })
                  }
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      new_password: e.target.value,
                    })
                  }
                  className="input"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 6 characters
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirm_password: e.target.value,
                    })
                  }
                  className="input"
                  required
                />
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
        <div className="border-t border-gray-200 mt-6 pt-6">
          <button
            onClick={() => setIsDeleting(!isDeleting)}
            className="text-red-600 hover:underline text-sm"
          >
            {isDeleting ? "Cancel" : "Delete Account"}
          </button>

          {isDeleting && (
            <form
              onSubmit={handleDeleteSubmit}
              className="mt-4 space-y-4 p-4 bg-red-50 rounded-lg"
            >
              <p className="text-sm text-red-700 font-medium">
                ⚠️ Warning: This will permanently delete your account, all
                listings, and comments.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter your password to confirm
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="input"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg"
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
