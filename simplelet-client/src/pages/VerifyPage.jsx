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

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    setUser(userData);

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
      if (error.response?.status === 401) {
        navigate("/login");
      }
    },
  });

  const verifyMutation = useMutation({
    mutationFn: verifyCode,
    onSuccess: () => {
      toast.success("Phone verified successfully!");
      if (user) {
        const updatedUser = { ...user, is_verified: true };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
      navigate("/");
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.error || "Invalid code";
      toast.error(errorMsg);
      if (error.response?.status === 400) {
        setCode("");
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

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (user.is_verified) {
    navigate("/");
    return null;
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-6 sm:p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-center mb-6 heading-gradient">
          Verify Your Phone
        </h2>

        <div className="bg-black/50 border border-white/10 rounded-xl p-3 mb-6 text-center">
          <p className="text-sm text-gray-400">
            We sent a code to <span className="text-white">{user.phone}</span>
          </p>
        </div>

        {!codeSent ? (
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-6">
              We'll send a 6-digit verification code to your phone number.
            </p>
            <button
              onClick={handleSendCode}
              disabled={sendMutation.isPending}
              className="w-full btn-primary"
            >
              {sendMutation.isPending ? "Sending..." : "Send Verification Code"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="label">Enter 6-Digit Code</label>
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
              <p className="text-[10px] text-gray-500 mt-1 text-center">
                Code expires in 10 minutes
              </p>
            </div>

            <button
              type="submit"
              disabled={verifyMutation.isPending || code.length !== 6}
              className="w-full btn-primary"
            >
              {verifyMutation.isPending ? "Verifying..." : "Verify Phone"}
            </button>

            <button
              type="button"
              onClick={handleSendCode}
              disabled={sendMutation.isPending}
              className="w-full text-sm text-gray-400 hover:text-white transition disabled:opacity-50"
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
