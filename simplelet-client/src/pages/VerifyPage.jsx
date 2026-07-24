// src/pages/VerifyPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import API from "../services/api";

// ============ ERROR MESSAGES ============
const getErrorMessage = (error) => {
  const status = error.response?.status;
  const data = error.response?.data;

  const errorMap = {
    invalid_code: "❌ Invalid verification code. Please check and try again.",
    code_expired:
      "⏳ Your verification code has expired. Please request a new one.",
    already_verified: "✅ Your phone is already verified! Redirecting...",
    verification_failed: "❌ Verification failed. Please try again.",
    too_many_attempts: "⏳ Too many failed attempts. Please wait 5 minutes.",
    network_error: "📡 Network error. Please check your connection.",
    server_error: "⚠️ Server error. Please try again later.",
  };

  const errorCode = data?.error_code || data?.error || "";
  if (errorCode && errorMap[errorCode]) {
    return errorMap[errorCode];
  }

  if (status === 400)
    return "❌ Invalid verification code. Please check and try again.";
  if (status === 401) return "🔒 Session expired. Please login again.";
  if (status === 429) return "⏳ Too many attempts. Please wait a few minutes.";
  if (status === 500) return "⚠️ Server error. Please try again later.";
  if (!error.response) return "📡 Network error. Please check your connection.";

  return (
    data?.message || data?.error || "❌ Verification failed. Please try again."
  );
};

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
  const [resendCount, setResendCount] = useState(0);
  const [canResend, setCanResend] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      toast.error("🔒 Please login first");
      navigate("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    setUser(userData);

    if (userData.is_verified) {
      toast.success("✅ Your phone is already verified!");
      navigate("/");
      return;
    }

    if (!codeSent) {
      sendMutation.mutate();
    }
  }, []);

  const sendMutation = useMutation({
    mutationFn: sendVerification,
    onSuccess: () => {
      setCodeSent(true);
      setResendCount((prev) => prev + 1);
      setCanResend(false);
      toast.success("✅ Verification code sent! Check your phone.");

      // Enable resend after 60 seconds
      setTimeout(() => {
        setCanResend(true);
      }, 60000);
    },
    onError: (error) => {
      const errorMsg = getErrorMessage(error);
      toast.error(errorMsg);

      if (error.response?.status === 401) {
        toast.error("🔒 Session expired. Please login again.");
        navigate("/login");
      }
    },
  });

  const verifyMutation = useMutation({
    mutationFn: verifyCode,
    onSuccess: () => {
      toast.success("🎉 Phone verified successfully!");
      if (user) {
        const updatedUser = { ...user, is_verified: true };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
      navigate("/");
    },
    onError: (error) => {
      const errorMsg = getErrorMessage(error);
      toast.error(errorMsg);

      // Handle expired code
      if (errorMsg.includes("expired")) {
        setCodeSent(false);
        setCode("");
        toast.info("🔄 Please request a new verification code.");
      }

      // Handle too many attempts
      if (error.response?.status === 429) {
        setCode("");
      }
    },
  });

  const handleSendCode = () => {
    if (!canResend) {
      toast.warning(
        "⏳ Please wait 60 seconds before requesting another code.",
      );
      return;
    }
    sendMutation.mutate();
  };

  const handleVerify = (e) => {
    e.preventDefault();

    if (!code) {
      toast.error("📱 Please enter the verification code.");
      return;
    }
    if (code.length !== 6) {
      toast.error("📱 Please enter the 6-digit code.");
      return;
    }

    verifyMutation.mutate(code);
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (user.is_verified) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-6 sm:p-8 shadow-xl text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Already Verified!
          </h2>
          <p className="text-gray-400 mb-6">
            Your phone number is already verified.
          </p>
          <button onClick={() => navigate("/")} className="btn-primary w-full">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-6 sm:p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-center mb-2 heading-gradient">
          Verify Your Phone
        </h2>
        <p className="text-center text-gray-400 text-sm mb-6">
          Confirm your phone number to unlock all features
        </p>

        <div className="bg-black/50 border border-white/10 rounded-xl p-3 mb-6 text-center">
          <p className="text-sm text-gray-400">
            We'll send a code to{" "}
            <span className="text-white font-medium">{user.phone}</span>
          </p>
        </div>

        {!codeSent ? (
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-6">
              We'll send a 6-digit verification code to your phone number.
            </p>
            <button
              onClick={handleSendCode}
              disabled={sendMutation.isPending || !canResend}
              className="w-full btn-primary disabled:opacity-50"
            >
              {sendMutation.isPending ? "Sending..." : "Send Verification Code"}
            </button>
            {!canResend && resendCount > 0 && (
              <p className="text-[10px] text-gray-500 mt-2">
                ⏳ Please wait 60 seconds before requesting another code.
              </p>
            )}
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
              className="w-full btn-primary disabled:opacity-50"
            >
              {verifyMutation.isPending ? "Verifying..." : "Verify Phone"}
            </button>

            <button
              type="button"
              onClick={handleSendCode}
              disabled={sendMutation.isPending || !canResend}
              className="w-full text-sm text-gray-400 hover:text-white transition disabled:opacity-50"
            >
              {sendMutation.isPending
                ? "Sending..."
                : "🔄 Didn't receive code? Resend"}
            </button>

            {!canResend && resendCount > 0 && (
              <p className="text-[10px] text-gray-500 text-center">
                ⏳ Please wait 60 seconds before resending.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
