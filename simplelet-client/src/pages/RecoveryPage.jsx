// src/pages/RecoveryPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import API from "../services/api";

const getRateLimitMessage = (error) => {
  const retryAfter = Number(error.response?.headers?.["retry-after"]);
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    const minutes = Math.ceil(retryAfter / 60);
    return `⏳ Too many attempts. Please wait ${minutes} minute${
      minutes === 1 ? "" : "s"
    } before trying again.`;
  }

  return "⏳ Too many attempts. Please wait a few minutes before trying again.";
};

const getErrorMessage = (error) => {
  const status = error.response?.status;
  const data = error.response?.data;
  const errorCode = data?.error_code || data?.error || "";

  const errorMap = {
    invalid_phone:
      "📱 Please enter a valid phone number in the format +254XXXXXXXXX.",
    account_not_found:
      "❌ No account found with this phone number. Please register first.",
    recovery_not_set:
      "🔐 This account does not have password recovery set up.",
    incorrect_security_answer:
      "❌ Incorrect security answer. Please try again.",
    invalid_code: "❌ Invalid verification code. Please check and try again.",
    code_expired:
      "⏳ Your recovery code has expired. Please request a new one.",
    weak_password:
      "🔑 Password must be at least 6 characters long.",
    recovery_failed: "❌ Password recovery failed. Please try again.",
    network_error: "📡 Network error. Please check your internet connection.",
    server_error: "⚠️ Server error. Please try again later.",
  };

  if (errorCode && errorMap[errorCode]) {
    return errorMap[errorCode];
  }

  if (status === 400) return "⚠️ Please check your details and try again.";
  if (status === 401) return "❌ Incorrect security answer.";
  if (status === 403) return "🚫 This account is not allowed to recover password.";
  if (status === 404) return "❌ Account not found. Please register first.";
  if (status === 409) return "🔐 Password recovery is not available for this account.";
  if (status === 429) return getRateLimitMessage(error);
  if (status === 500) return "⚠️ Server error. Please try again later.";
  if (!error.response) return "📡 Network error. Please check your connection.";

  return data?.message || data?.error || "❌ Recovery failed. Please try again.";
};

const lookupQuestion = async (phone) => {
  const { data } = await API.post("/auth/recovery-question", { phone });
  return data;
};

const startRecovery = async ({ phone, answer }) => {
  const { data } = await API.post("/auth/start-password-recovery", {
    phone,
    answer,
  });
  return data;
};

const completeRecovery = async ({ phone, code, new_password }) => {
  const { data } = await API.post("/auth/complete-password-recovery", {
    phone,
    code,
    new_password,
  });
  return data;
};

export default function RecoveryPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const clearError = (field) => {
    setFieldErrors((current) => ({ ...current, [field]: null }));
  };

  const lookupMutation = useMutation({
    mutationFn: lookupQuestion,
    onSuccess: (data) => {
      setFieldErrors({});
      setQuestion(data.question);
      setStep(2);
      toast.success("🔐 Security question loaded.");
    },
    onError: (error) => {
      const message = getErrorMessage(error);
      setFieldErrors((current) => ({ ...current, phone: message }));
      toast.error(message);
    },
  });

  const startMutation = useMutation({
    mutationFn: startRecovery,
    onSuccess: (data) => {
      setFieldErrors({});
      setStep(3);
      toast.success(data.message || "✅ Recovery code sent to your phone.");
    },
    onError: (error) => {
      const message = getErrorMessage(error);
      setFieldErrors((current) => ({ ...current, answer: message }));
      toast.error(message);
    },
  });

  const completeMutation = useMutation({
    mutationFn: completeRecovery,
    onSuccess: () => {
      setFieldErrors({});
      toast.success("🎉 Password updated successfully. Please login.");
      navigate("/login");
    },
    onError: (error) => {
      const message = getErrorMessage(error);
      setFieldErrors((current) => ({
        ...current,
        code: message,
      }));
      toast.error(message);

      if (error.response?.status === 400 && message.includes("expired")) {
        setStep(2);
        setCode("");
      }
    },
  });

  const handleLookup = (e) => {
    e.preventDefault();

    if (!phone) {
      setFieldErrors((current) => ({ ...current, phone: "📱 Please enter your phone number." }));
      toast.error("📱 Please enter your phone number.");
      return;
    }

    if (!phone.match(/^\+254[0-9]{9}$/)) {
      setFieldErrors((current) => ({
        ...current,
        phone: "📱 Please use +254XXXXXXXXX format.",
      }));
      toast.error("📱 Please use +254XXXXXXXXX format.");
      return;
    }

    setFieldErrors({});
    lookupMutation.mutate(phone);
  };

  const handleAnswer = (e) => {
    e.preventDefault();

    if (!answer.trim()) {
      setFieldErrors((current) => ({
        ...current,
        answer: "🔐 Please enter your security answer.",
      }));
      toast.error("🔐 Please enter your security answer.");
      return;
    }

    setFieldErrors({});
    startMutation.mutate({ phone, answer });
  };

  const handleComplete = (e) => {
    e.preventDefault();

    if (!code) {
      setFieldErrors((current) => ({ ...current, code: "📱 Please enter the verification code." }));
      toast.error("📱 Please enter the verification code.");
      return;
    }

    if (code.length !== 6) {
      setFieldErrors((current) => ({ ...current, code: "📱 Please enter the 6-digit code." }));
      toast.error("📱 Please enter the 6-digit code.");
      return;
    }

    if (!newPassword) {
      setFieldErrors((current) => ({ ...current, newPassword: "🔑 Please enter a new password." }));
      toast.error("🔑 Please enter a new password.");
      return;
    }

    if (newPassword.length < 6) {
      setFieldErrors((current) => ({ ...current, newPassword: "🔑 Password must be at least 6 characters." }));
      toast.error("🔑 Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setFieldErrors((current) => ({
        ...current,
        confirmPassword: "🔑 Passwords do not match.",
      }));
      toast.error("🔑 Passwords do not match.");
      return;
    }

    setFieldErrors({});
    completeMutation.mutate({
      phone,
      code,
      new_password: newPassword,
    });
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-6 sm:p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-center mb-2 heading-gradient">
          Reset Your Password
        </h2>
        <p className="text-center text-gray-400 text-sm mb-6">
          Verify your security question, then confirm with an SMS code.
        </p>

        {step === 1 && (
          <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label className="label">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  clearError("phone");
                }}
                placeholder="+254712345678"
                className="input"
                required
              />
              {fieldErrors.phone && (
                <p className="text-red-400 text-[10px] mt-1">{fieldErrors.phone}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={lookupMutation.isPending}
              className="w-full btn-primary"
            >
              {lookupMutation.isPending ? "Loading..." : "Continue"}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-sm text-gray-400 hover:text-white transition">
                ← Back to login
              </Link>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleAnswer} className="space-y-4">
            <div className="bg-black/50 border border-white/10 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Security question</p>
              <p className="text-sm text-white">{question}</p>
            </div>

            <div>
              <label className="label">Your Answer</label>
              <input
                type="text"
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  clearError("answer");
                }}
                placeholder="Enter your answer"
                className="input"
                required
              />
              {fieldErrors.answer && (
                <p className="text-red-400 text-[10px] mt-1">{fieldErrors.answer}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={startMutation.isPending}
              className="w-full btn-primary"
            >
              {startMutation.isPending ? "Verifying..." : "Verify Answer & Send Code"}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-sm text-gray-400 hover:text-white transition"
            >
              ← Change phone number
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleComplete} className="space-y-4">
            <div className="bg-black/50 border border-white/10 rounded-xl p-3 text-center">
              <p className="text-sm text-gray-400">
                We sent a recovery code to <span className="text-white">{phone}</span>
              </p>
              <p className="text-[10px] text-gray-500 mt-1">
                Code expires in 10 minutes
              </p>
            </div>

            <div>
              <label className="label">Verification Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  clearError("code");
                }}
                placeholder="123456"
                maxLength={6}
                className="input text-center text-2xl tracking-widest font-mono"
                required
              />
              {fieldErrors.code && (
                <p className="text-red-400 text-[10px] mt-1 text-center">
                  {fieldErrors.code}
                </p>
              )}
            </div>

            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    clearError("newPassword");
                  }}
                  placeholder="Create a new password"
                  className="input pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {fieldErrors.newPassword && (
                <p className="text-red-400 text-[10px] mt-1">
                  {fieldErrors.newPassword}
                </p>
              )}
            </div>

            <div>
              <label className="label">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearError("confirmPassword");
                  }}
                  placeholder="Confirm new password"
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
              {fieldErrors.confirmPassword && (
                <p className="text-red-400 text-[10px] mt-1">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={completeMutation.isPending}
              className="w-full btn-primary"
            >
              {completeMutation.isPending ? "Saving..." : "Save New Password"}
            </button>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full text-sm text-gray-400 hover:text-white transition"
            >
              ← Back to answer
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
