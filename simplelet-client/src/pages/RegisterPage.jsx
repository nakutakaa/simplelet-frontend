// src/pages/RegisterPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { GoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";
import API from "../services/api";
import SafetyTip from "../components/SafetyTip";
import PhonePromptModal from "../components/PhonePromptModal";
import { EyeIcon, EyeSlashIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

const SECURITY_QUESTIONS = [
  { key: "mother_maiden_name", label: "What is your mother's maiden name?" },
  { key: "first_school", label: "What was the name of your first school?" },
  { key: "birth_town", label: "What town were you born in?" },
  { key: "favorite_teacher", label: "What was the name of your favorite teacher?" },
  { key: "childhood_friend", label: "What was the name of your childhood best friend?" },
];

const getErrorMessage = (error) => {
  const status = error.response?.status;
  const data = error.response?.data;

  if (status === 409) return "This phone number is already registered. Please login.";
  if (status === 400) return data?.error || "Please check your information and try again.";
  if (!error.response) return "Network error. Please check your connection.";

  return data?.message || data?.error || "Something went wrong. Please try again.";
};

const registerUser = async (payload) => {
  const { data } = await API.post("/auth/register", payload);
  return data;
};

const verifyGoogleToken = async (token) => {
  const { data } = await API.post("/auth/google", { token });
  return data;
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    confirmPassword: "",
    securityQuestionKey: "",
    securityAnswer: "",
  });

  const isPhoneValid = /^\+254[0-9]{9}$/.test(formData.phone);
  const isPasswordLengthValid = formData.password.length >= 6;
  const doPasswordsMatch = formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword;

  const googleAuthMutation = useMutation({
    mutationFn: verifyGoogleToken,
    onSuccess: (data) => {
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (!data.user.phone) {
        setShowPhoneModal(true);
      } else {
        toast.success("Welcome to SimpleLet!");
        navigate("/");
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      setFieldErrors({});
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast.success("Account created successfully!");
      navigate("/");
    },
    onError: (error) => {
      const errorMsg = getErrorMessage(error);
      setFieldErrors((current) => ({ ...current, phone: errorMsg }));
      toast.error(errorMsg);
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((current) => ({ ...current, [name]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setFieldErrors({ name: "Please enter your full name." });
      return;
    }
    if (!isPhoneValid) {
      setFieldErrors({ phone: "Format must be +254XXXXXXXXX (9 digits after +254)" });
      return;
    }
    if (!isPasswordLengthValid) {
      setFieldErrors({ password: "Password must be at least 6 characters." });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match." });
      return;
    }

    setFieldErrors({});
    registerMutation.mutate({
      name: formData.name,
      phone: formData.phone,
      password: formData.password,
      security_question_key: formData.securityQuestionKey,
      security_answer: formData.securityAnswer,
    });
  };

  return (
    <div className="max-w-md mx-auto my-8 px-4">
      <div className="bg-[#121212] rounded-2xl border border-white/10 p-6 sm:p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-center mb-2 text-white">
          Create an Account
        </h2>
        <p className="text-center text-gray-400 text-sm mb-6">
          Join SimpleLet and start exploring properties
        </p>

        <SafetyTip page="register" className="mb-6" />

        <div className="mb-6">
          <div className="flex justify-center w-full">
            {googleAuthMutation.isPending ? (
              <div className="py-2 text-sm text-gray-400 animate-pulse">
                Authenticating with Google...
              </div>
            ) : (
              <GoogleLogin
                onSuccess={(res) => res.credential && googleAuthMutation.mutate(res.credential)}
                onError={() => toast.error("Google Sign-In failed or popup was closed.")}
                theme="filled_black"
                shape="pill"
                width="100%"
              />
            )}
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#121212] px-3 text-gray-400 font-medium">
                Or register with phone
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              className={`w-full bg-black/40 border ${
                fieldErrors.name ? "border-red-500/80" : "border-white/10 focus:border-blue-500"
              } rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all`}
              required
            />
            {fieldErrors.name && <p className="text-red-400 text-xs mt-1.5">{fieldErrors.name}</p>}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
              Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+254712345678"
                className={`w-full bg-black/40 border ${
                  fieldErrors.phone
                    ? "border-red-500/80"
                    : isPhoneValid
                    ? "border-blue-500/80 focus:border-blue-500"
                    : "border-white/10 focus:border-blue-500"
                } rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all`}
                required
              />
              {isPhoneValid && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <CheckCircleIcon className="w-5 h-5 text-blue-400" />
                </div>
              )}
            </div>
            {fieldErrors.phone ? (
              <p className="text-red-400 text-xs mt-1.5">{fieldErrors.phone}</p>
            ) : (
              <p className="text-[11px] text-gray-500 mt-1">Format: +254712345678</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                className={`w-full bg-black/40 border ${
                  fieldErrors.password ? "border-red-500/80" : "border-white/10 focus:border-blue-500"
                } rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition"
              >
                {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
            {/* Real-time indicator bar */}
            {formData.password.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      formData.password.length >= 8
                        ? "w-full bg-blue-500"
                        : formData.password.length >= 6
                        ? "w-2/3 bg-blue-400"
                        : "w-1/3 bg-blue-600/50"
                    }`}
                  />
                </div>
                <span className="text-[10px] text-gray-400">
                  {formData.password.length >= 8 ? "Strong" : formData.password.length >= 6 ? "Good" : "Weak"}
                </span>
              </div>
            )}
            {fieldErrors.password && <p className="text-red-400 text-xs mt-1.5">{fieldErrors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                className={`w-full bg-black/40 border ${
                  fieldErrors.confirmPassword
                    ? "border-red-500/80"
                    : doPasswordsMatch
                    ? "border-blue-500/80"
                    : "border-white/10 focus:border-blue-500"
                } rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all`}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition"
              >
                {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
            {doPasswordsMatch && (
              <p className="text-blue-400 text-xs mt-1 flex items-center gap-1">
                <CheckCircleIcon className="w-4 h-4" /> Passwords match
              </p>
            )}
            {fieldErrors.confirmPassword && <p className="text-red-400 text-xs mt-1.5">{fieldErrors.confirmPassword}</p>}
          </div>

          {/* Security Question */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
              Security Question
            </label>
            <select
              name="securityQuestionKey"
              value={formData.securityQuestionKey}
              onChange={handleChange}
              className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
            >
              <option value="">Choose one question</option>
              {SECURITY_QUESTIONS.map((q) => (
                <option key={q.key} value={q.key}>{q.label}</option>
              ))}
            </select>
          </div>

          {/* Security Answer */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
              Security Answer
            </label>
            <input
              type="text"
              name="securityAnswer"
              value={formData.securityAnswer}
              onChange={handleChange}
              placeholder="Your answer"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 text-white font-bold py-3.5 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-blue-600/20"
          >
            {registerMutation.isPending ? "Creating Account..." : "Create Account"}
          </button>

          <div className="text-center pt-2">
            <p className="text-sm text-gray-400">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium underline">
                Login here
              </Link>
            </p>
          </div>
        </form>
      </div>

      <PhonePromptModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onSuccess={() => {
          toast.success("Welcome to SimpleLet!");
          navigate("/");
        }}
      />
    </div>
  );
}
