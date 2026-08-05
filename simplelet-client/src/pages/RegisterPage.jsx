// src/pages/RegisterPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import API from "../services/api";
import SafetyTip from "../components/SafetyTip";

const SECURITY_QUESTIONS = [
  {
    key: "mother_maiden_name",
    label: "What is your mother's maiden name?",
  },
  {
    key: "first_school",
    label: "What was the name of your first school?",
  },
  {
    key: "birth_town",
    label: "What town were you born in?",
  },
  {
    key: "favorite_teacher",
    label: "What was the name of your favorite teacher?",
  },
  {
    key: "childhood_friend",
    label: "What was the name of your childhood best friend?",
  },
];

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
const getErrorMessage = (error) => {
  const status = error.response?.status;
  const data = error.response?.data;
  const errorCode = data?.error_code || data?.error || "";

  const errorMap = {
    phone_exists:
      "📱 This phone number is already registered. Please login instead.",
    invalid_phone:
      "📱 Please enter a valid phone number in the format +254XXXXXXXXX.",
    weak_password:
      "🔑 Password must be at least 6 characters and contain letters and numbers.",
    name_required: "👤 Please enter your full name.",
    invalid_code: "❌ Invalid verification code. Please check and try again.",
    code_expired:
      "⏳ Your verification code has expired. Please request a new one.",
    security_question_required: "🔐 Please choose a security question.",
    security_answer_required: "🔐 Please enter your security answer.",
    registration_failed: "❌ Registration failed. Please try again.",
    network_error: "📡 Network error. Please check your internet connection.",
    server_error: "⚠️ Server error. Please try again later.",
  };

  if (errorCode && errorMap[errorCode]) {
    return errorMap[errorCode];
  }

  if (status === 400) return "⚠️ Please check your information and try again.";
  if (status === 409)
    return "📱 This phone number is already registered. Please login.";
  if (status === 429) return getRateLimitMessage(error);
  if (status === 500) return "⚠️ Server error. Please try again later.";
  if (!error.response) return "📡 Network error. Please check your connection.";

  return (
    data?.message || data?.error || "❌ Something went wrong. Please try again."
  );
};

const sendRegistrationCode = async (payload) => {
  const { data } = await API.post("/auth/send-registration-code", payload);
  return data;
};

const verifyAndRegister = async ({ phone, code }) => {
  const { data } = await API.post("/auth/verify-and-register", {
    phone,
    code,
  });
  return data;
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    confirmPassword: "",
    securityQuestionKey: "",
    securityAnswer: "",
    code: "",
  });

  const sendCodeMutation = useMutation({
    mutationFn: sendRegistrationCode,
    onSuccess: () => {
      setFieldErrors({});
      toast.success("✅ Verification code sent! Check your phone.");
      setStep(2);
    },
    onError: (error) => {
      const errorMsg = getErrorMessage(error);
      setFieldErrors((current) => ({
        ...current,
        phone: errorMsg,
      }));
      toast.error(errorMsg);

      // If phone exists, offer to login
      if (error.response?.status === 409) {
        setTimeout(() => {
          if (
            confirm(
              "This phone is already registered. Would you like to login instead?",
            )
          ) {
            navigate("/login");
          }
        }, 1500);
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: verifyAndRegister,
    onSuccess: (data) => {
      setFieldErrors({});
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast.success("🎉 Account created successfully! Welcome to SimpleLet!");
      navigate("/");
    },
    onError: (error) => {
      const errorMsg = getErrorMessage(error);
      setFieldErrors((current) => ({
        ...current,
        code: errorMsg,
      }));
      toast.error(errorMsg);

      if (error.response?.data?.error?.includes("expired")) {
        setStep(1);
        toast.info("🔄 Please request a new verification code.");
      }
    },
  });

  const handleSendCode = (e) => {
    e.preventDefault();

    // Client-side validation
    if (!formData.name.trim()) {
      setFieldErrors((current) => ({ ...current, name: "👤 Please enter your full name." }));
      toast.error("👤 Please enter your full name.");
      return;
    }
    if (formData.name.length < 2) {
      setFieldErrors((current) => ({ ...current, name: "👤 Name must be at least 2 characters." }));
      toast.error("👤 Name must be at least 2 characters.");
      return;
    }
    if (!formData.phone) {
      setFieldErrors((current) => ({ ...current, phone: "📱 Please enter your phone number." }));
      toast.error("📱 Please enter your phone number.");
      return;
    }
    if (!formData.phone.match(/^\+254[0-9]{9}$/)) {
      setFieldErrors((current) => ({
        ...current,
        phone: "📱 Invalid phone format. Please use +254XXXXXXXXX (10 digits after +254)",
      }));
      toast.error(
        "📱 Invalid phone format. Please use +254XXXXXXXXX (10 digits after +254)",
      );
      return;
    }
    if (!formData.password) {
      setFieldErrors((current) => ({ ...current, password: "🔑 Please create a password." }));
      toast.error("🔑 Please create a password.");
      return;
    }
    if (formData.password.length < 6) {
      setFieldErrors((current) => ({ ...current, password: "🔑 Password must be at least 6 characters." }));
      toast.error("🔑 Password must be at least 6 characters.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setFieldErrors((current) => ({
        ...current,
        confirmPassword: "🔑 Passwords do not match. Please try again.",
      }));
      toast.error("🔑 Passwords do not match. Please try again.");
      return;
    }
    if (!formData.securityQuestionKey) {
      setFieldErrors((current) => ({
        ...current,
        securityQuestionKey: "🔐 Please choose a security question.",
      }));
      toast.error("🔐 Please choose a security question.");
      return;
    }
    if (!formData.securityAnswer.trim()) {
      setFieldErrors((current) => ({
        ...current,
        securityAnswer: "🔐 Please enter your security answer.",
      }));
      toast.error("🔐 Please enter your security answer.");
      return;
    }
    if (formData.securityAnswer.trim().length < 2) {
      setFieldErrors((current) => ({
        ...current,
        securityAnswer: "🔐 Security answer must be at least 2 characters.",
      }));
      toast.error("🔐 Security answer must be at least 2 characters.");
      return;
    }

    setFieldErrors({});
    sendCodeMutation.mutate({
      name: formData.name,
      phone: formData.phone,
      password: formData.password,
      security_question_key: formData.securityQuestionKey,
      security_answer: formData.securityAnswer,
    });
  };

  const handleVerify = (e) => {
    e.preventDefault();
    if (!formData.code) {
      setFieldErrors((current) => ({ ...current, code: "📱 Please enter the verification code." }));
      toast.error("📱 Please enter the verification code.");
      return;
    }
    if (formData.code.length !== 6) {
      setFieldErrors((current) => ({ ...current, code: "📱 Please enter the 6-digit code." }));
      toast.error("📱 Please enter the 6-digit code.");
      return;
    }
    setFieldErrors((current) => ({ ...current, code: null }));
    registerMutation.mutate({
      phone: formData.phone,
      code: formData.code,
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (fieldErrors[e.target.name]) {
      setFieldErrors((current) => ({ ...current, [e.target.name]: null }));
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-6 sm:p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-center mb-2 heading-gradient">
          Create an Account
        </h2>
        <p className="text-center text-gray-400 text-sm mb-6">
          Join SimpleLet and start posting properties
        </p>

        <SafetyTip page="register" className="mb-6" />

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="input"
                required
              />
              {fieldErrors.name && (
                <p className="text-red-400 text-[10px] mt-1">{fieldErrors.name}</p>
              )}
              <p className="text-[10px] text-gray-500 mt-1">
                This will be displayed on your listings
              </p>
            </div>

            <div>
              <label className="label">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+254712345678"
                className="input"
                required
              />
              {fieldErrors.phone && (
                <p className="text-red-400 text-[10px] mt-1">{fieldErrors.phone}</p>
              )}
              <p className="text-[10px] text-gray-500 mt-1">
                Use format: +254XXXXXXXXX (10 digits after +254)
              </p>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password (min 6 characters)"
                  className="input pr-10"
                  required
                />
                {fieldErrors.password && (
                  <p className="text-red-400 text-[10px] mt-1">
                    {fieldErrors.password}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                Password must be at least 6 characters
              </p>
            </div>

            <div>
              <label className="label">Security Question</label>
              <select
                name="securityQuestionKey"
                value={formData.securityQuestionKey}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="">Choose one question</option>
                {SECURITY_QUESTIONS.map((question) => (
                  <option key={question.key} value={question.key}>
                    {question.label}
                  </option>
                ))}
              </select>
              {fieldErrors.securityQuestionKey && (
                <p className="text-red-400 text-[10px] mt-1">
                  {fieldErrors.securityQuestionKey}
                </p>
              )}
              <p className="text-[10px] text-gray-500 mt-1">
                Used later to recover your password
              </p>
            </div>

            <div>
              <label className="label">Security Answer</label>
              <input
                type="text"
                name="securityAnswer"
                value={formData.securityAnswer}
                onChange={handleChange}
                placeholder="Your answer"
                className="input"
                required
              />
              {fieldErrors.securityAnswer && (
                <p className="text-red-400 text-[10px] mt-1">
                  {fieldErrors.securityAnswer}
                </p>
              )}
              <p className="text-[10px] text-gray-500 mt-1">
                Keep it memorable, but not obvious
              </p>
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="input pr-10"
                  required
                />
                {fieldErrors.confirmPassword && (
                  <p className="text-red-400 text-[10px] mt-1">
                    {fieldErrors.confirmPassword}
                  </p>
                )}
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
              disabled={sendCodeMutation.isPending}
              className="w-full btn-primary"
            >
              {sendCodeMutation.isPending
                ? "Sending code..."
                : "Send Verification Code"}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-400">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-blue-400 hover:text-blue-300 transition"
                >
                  Login here
                </Link>
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="bg-black/50 border border-white/10 rounded-xl p-3 text-center">
              <p className="text-sm text-gray-400">
                We sent a code to{" "}
                <span className="text-white">{formData.phone}</span>
              </p>
              <p className="text-[10px] text-gray-500 mt-1">
                Code expires in 10 minutes
              </p>
            </div>

            <div>
              <label className="label">Verification Code</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
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
              disabled={registerMutation.isPending}
              className="w-full btn-primary"
            >
              {registerMutation.isPending
                ? "Verifying..."
                : "Verify & Create Account"}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-sm text-gray-400 hover:text-white transition"
            >
              ← Back to edit information
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                toast.info("🔄 Request a new code with your details.");
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
