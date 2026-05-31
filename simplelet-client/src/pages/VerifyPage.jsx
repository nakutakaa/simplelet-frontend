// src/pages/VerifyPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import API from "../services/api";

const sendVerification = async () => {
  const { data } = await API.post("/auth/send-verification");
  return data;
};

const verifyCode = async (code) => {
  const { data } = await API.post("/auth/verify-phone", { code });
  return data;
};

export default function VerifyPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [user, setUser] = useState(null);

  // Check if user is logged in and get user info
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      // No user logged in, redirect to login
      toast.error("Please login first");
      navigate("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    setUser(userData);

    // Auto-send verification code when page loads
    if (!codeSent && !userData.is_verified) {
      sendMutation.mutate();
    }
  }, []);

  const sendMutation = useMutation({
    mutationFn: sendVerification,
    onSuccess: () => {
      setCodeSent(true);
      toast.success("Verification code sent! Check your phone.");
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.error || "Failed to send code";
      toast.error(errorMsg);

      // If unauthorized, redirect to login
      if (error.response?.status === 401) {
        navigate("/login");
      }
    },
  });

  const verifyMutation = useMutation({
    mutationFn: verifyCode,
    onSuccess: (data) => {
      toast.success("Phone verified successfully!");

      // Update user in localStorage with verified status
      if (user) {
        const updatedUser = { ...user, is_verified: true };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      navigate("/");
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.error || "Invalid code";
      toast.error(errorMsg);

      // If code is invalid, allow user to try again
      if (error.response?.status === 400) {
        setCode(""); // Clear the input
      }
    },
  });

  const handleSendCode = () => {
    sendMutation.mutate();
  };

  const handleVerify = (e) => {
    e.preventDefault();
    if (code.length === 6) {
      verifyMutation.mutate(code);
    } else {
      toast.error("Please enter the 6-digit code");
    }
  };

  // Show loading state while checking user
  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // If already verified, redirect to home
  if (user.is_verified) {
    navigate("/");
    return null;
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-8">
        <h2 className="text-2xl font-bold text-center mb-6">
          Verify Your Phone
        </h2>

        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm text-center">
            We sent a code to <strong>{user.phone}</strong>
          </p>
        </div>

        {!codeSent ? (
          <div className="text-center">
            <p className="text-gray-600 mb-6">
              We'll send a 6-digit verification code to your phone number.
            </p>
            <button
              onClick={handleSendCode}
              disabled={sendMutation.isPending}
              className="w-full btn-primary disabled:opacity-50"
            >
              {sendMutation.isPending ? "Sending..." : "Send Verification Code"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enter 6-Digit Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="123456"
                maxLength={6}
                className="input text-center text-2xl tracking-widest font-mono"
                required
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Code expires in 10 minutes
              </p>
            </div>

            <button
              type="submit"
              disabled={verifyMutation.isPending || code.length !== 6}
              className="w-full btn-primary disabled:opacity-50"
            >
              {verifyMutation.isPending ? "Verifying..." : "Verify Phone"}
            </button>

            <button
              type="button"
              onClick={handleSendCode}
              disabled={sendMutation.isPending}
              className="w-full text-sm text-primary-600 hover:underline disabled:opacity-50"
            >
              {sendMutation.isPending
                ? "Sending..."
                : "Didn't receive code? Resend"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
