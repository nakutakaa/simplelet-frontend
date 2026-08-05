// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import API from "../services/api";
import SafetyTip from "../components/SafetyTip";

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

// ============ ERROR MESSAGES ============
const getErrorMessage = (error, context = "login") => {
  const status = error.response?.status;
  const data = error.response?.data;
  const errorCode = data?.error_code || data?.error || "";

  const errorMap = {
    invalid_credentials:
      "❌ The phone number or password you entered is incorrect. Please try again.",
    account_not_found:
      "❌ No account found with this phone number. Please register first.",
    account_suspended:
      "🚫 Your account has been suspended. Please contact support.",
    too_many_attempts:
      "⏳ Too many failed attempts. Please wait 5 minutes before trying again.",
    invalid_phone:
      "📱 Please enter a valid phone number in the format +254XXXXXXXXX.",
    phone_not_found:
      "❌ No account found with this phone number. Please register first.",
    invalid_code: "❌ Invalid verification code. Please check and try again.",
    code_expired:
      "⏳ Your verification code has expired. Please request a new one.",
    verification_failed: "❌ Verification failed. Please try again.",
    network_error:
      "📡 Network error. Please check your internet connection and try again.",
    server_error: "⚠️ Server error. Please try again later.",
  };

  // Check for specific error codes first
  if (errorCode && errorMap[errorCode]) {
    return errorMap[errorCode];
  }

  // Check by HTTP status
  if (status === 401)
    return "🔒 Authentication failed. Please check your credentials.";
  if (status === 404) return "❌ Account not found. Please register first.";
  if (status === 429) return getRateLimitMessage(error);
  if (status === 500) return "⚠️ Server error. Please try again later.";
  if (!error.response) return "📡 Network error. Please check your connection.";

  // Fallback
  return (
    data?.message || data?.error || "❌ Something went wrong. Please try again."
  );
};

const sendLoginCode = async ({ phone, password }) => {
  const { data } = await API.post("/auth/send-login-code", { phone, password });
  return data;
};

const verifyAndLogin = async ({ phone, code }) => {
  const { data } = await API.post("/auth/verify-and-login", { phone, code });
  return data;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const setFieldError = (field, message) => {
    setFieldErrors((current) => ({ ...current, [field]: message }));
  };

  const clearFieldError = (field) => {
    setFieldErrors((current) => ({ ...current, [field]: null }));
  };

  const clearAllFieldErrors = () => {
    setFieldErrors({});
  };

  const sendCodeMutation = useMutation({
    mutationFn: sendLoginCode,
    onSuccess: (data) => {
      clearAllFieldErrors();
      toast.success(
        data.message || "✅ Verification code sent! Check your phone.",
      );
      setStep(2);
    },
    onError: (error) => {
      const errorMsg = getErrorMessage(error, "send_code");
      clearAllFieldErrors();
      if (error.response?.status === 404) setFieldError("phone", errorMsg);
      else if (error.response?.status === 429) setFieldError("phone", errorMsg);
      else if (error.response?.status === 401) setFieldError("password", errorMsg);
      else setFieldError("password", errorMsg);
      toast.error(errorMsg);

      // Specific handling for account not found
      if (error.response?.status === 404) {
        setTimeout(() => {
          if (confirm("No account found. Would you like to register now?")) {
            navigate("/register");
          }
        }, 1500);
      }
    },
  });

  const loginMutation = useMutation({
    mutationFn: verifyAndLogin,
    onSuccess: (data) => {
      clearAllFieldErrors();
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast.success("🎉 Login successful!");
      navigate("/");
    },
    onError: (error) => {
      const errorMsg = getErrorMessage(error, "verify");
      clearAllFieldErrors();
      if (error.response?.status === 429) setFieldError("code", errorMsg);
      else if (error.response?.status === 401) setFieldError("code", errorMsg);
      else setFieldError("code", errorMsg);
      toast.error(errorMsg);

      // Handle expired code
      if (error.response?.data?.error?.includes("expired")) {
        setStep(1);
        toast.info("🔄 Please request a new verification code.");
      }

      // Handle too many attempts
      if (error.response?.status === 429) {
        setStep(1);
      }
    },
  });

  const handleSendCode = (e) => {
    e.preventDefault();

    // Client-side validation
    if (!phone) {
      setFieldError("phone", "📱 Please enter your phone number.");
      toast.error("📱 Please enter your phone number.");
      return;
    }
    if (!phone.match(/^\+254[0-9]{9}$/)) {
      setFieldError("phone", "📱 Invalid phone format. Please use +254XXXXXXXXX");
      toast.error("📱 Invalid phone format. Please use +254XXXXXXXXX");
      return;
    }
    if (!password) {
      setFieldError("password", "🔑 Please enter your password.");
      toast.error("🔑 Please enter your password.");
      return;
    }
    if (password.length < 6) {
      setFieldError("password", "🔑 Password must be at least 6 characters.");
      toast.error("🔑 Password must be at least 6 characters.");
      return;
    }

    clearAllFieldErrors();
    sendCodeMutation.mutate({ phone, password });
  };

  const handleVerify = (e) => {
    e.preventDefault();
    if (!code) {
      setFieldError("code", "📱 Please enter the verification code.");
      toast.error("📱 Please enter the verification code.");
      return;
    }
    if (code.length !== 6) {
      setFieldError("code", "📱 Please enter the 6-digit code.");
      toast.error("📱 Please enter the 6-digit code.");
      return;
    }
    clearAllFieldErrors();
    loginMutation.mutate({ phone, code });
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-6 sm:p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-center mb-2 heading-gradient">
          Login to SimpleLet
        </h2>
        <p className="text-center text-gray-400 text-sm mb-6">
          Access your account and manage listings
        </p>

        <SafetyTip page="login" className="mb-6" />

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="label">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  clearFieldError("phone");
                }}
                placeholder="+254712345678"
                className="input"
                required
              />
              {fieldErrors.phone && (
                <p className="text-red-400 text-[10px] mt-1">
                  {fieldErrors.phone}
                </p>
              )}
              <p className="text-[10px] text-gray-500 mt-1">
                Enter the phone number you used to register
              </p>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError("password");
                  }}
                  placeholder="Enter your password"
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
              {fieldErrors.password && (
                <p className="text-red-400 text-[10px] mt-1">
                  {fieldErrors.password}
                </p>
              )}
              <p className="text-[10px] text-gray-500 mt-1">
                Password must be at least 6 characters
              </p>
            </div>

            <button
              type="submit"
              disabled={sendCodeMutation.isPending}
              className="w-full btn-primary"
            >
              {sendCodeMutation.isPending
                ? "Sending code..."
                : "Send Verification Code"}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-400">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-blue-400 hover:text-blue-300 transition"
                >
                  Register here
                </Link>
              </p>
              <Link
                to="/recover-password"
                className="mt-2 inline-block text-xs text-gray-500 hover:text-blue-300 transition"
              >
                Forgot your password?
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="bg-black/50 border border-white/10 rounded-xl p-3 text-center">
              <p className="text-sm text-gray-400">
                We sent a code to <span className="text-white">{phone}</span>
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
                  clearFieldError("code");
                }}
                placeholder="123456"
                maxLength={6}
                className="input text-center text-2xl tracking-widest font-mono"
                required
                autoFocus
              />
              {fieldErrors.code && (
                <p className="text-red-400 text-[10px] mt-1 text-center">
                  {fieldErrors.code}
                </p>
              )}
              <p className="text-[10px] text-gray-500 mt-1">
                Enter the 6-digit code sent to your phone
              </p>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full btn-primary"
            >
              {loginMutation.isPending ? "Verifying..." : "Verify & Login"}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-sm text-gray-400 hover:text-white transition"
            >
              ← Use different credentials
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                toast.info("🔄 Request a new code with your credentials.");
              }}
              className="w-full text-xs text-gray-500 hover:text-gray-400 transition"
            >
              🔄 Resend verification code
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
