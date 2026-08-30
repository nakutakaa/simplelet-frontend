// src/pages/RegisterPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { GoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";
import API from "../services/api";
import SafetyTip from "../components/SafetyTip";
import PhonePromptModal from "../components/PhonePromptModal";

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

  if (status === 409) return "📱 This phone number is already registered. Please login.";
  if (status === 400) return data?.error || "⚠️ Please check your information and try again.";
  if (!error.response) return "📡 Network error. Please check your connection.";

  return data?.message || data?.error || "❌ Something went wrong. Please try again.";
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

  const googleAuthMutation = useMutation({
    mutationFn: verifyGoogleToken,
    onSuccess: (data) => {
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (!data.user.phone) {
        setShowPhoneModal(true);
      } else {
        toast.success("🎉 Welcome to SimpleLet!");
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
      toast.success("🎉 Account created successfully! Welcome to SimpleLet!");
      navigate("/");
    },
    onError: (error) => {
      const errorMsg = getErrorMessage(error);
      setFieldErrors((current) => ({ ...current, phone: errorMsg }));
      toast.error(errorMsg);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setFieldErrors({ name: "👤 Please enter your full name." });
      return;
    }
    if (!formData.phone.match(/^\+254[0-9]{9}$/)) {
      setFieldErrors({ phone: "📱 Format: +254XXXXXXXXX (9 digits after +254)" });
      return;
    }
    if (formData.password.length < 6) {
      setFieldErrors({ password: "🔑 Password must be at least 6 characters." });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setFieldErrors({ confirmPassword: "🔑 Passwords do not match." });
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
              <span className="bg-[#0a0a0a] px-3 text-gray-500 font-medium">
                Or register with phone
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            {fieldErrors.name && <p className="text-red-400 text-[10px] mt-1">{fieldErrors.name}</p>}
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
            {fieldErrors.phone && <p className="text-red-400 text-[10px] mt-1">{fieldErrors.phone}</p>}
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create password (min 6 chars)"
                className="input pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {fieldErrors.password && <p className="text-red-400 text-[10px] mt-1">{fieldErrors.password}</p>}
          </div>

          <div>
            <label className="label">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                className="input pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
              >
                {showConfirmPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {fieldErrors.confirmPassword && <p className="text-red-400 text-[10px] mt-1">{fieldErrors.confirmPassword}</p>}
          </div>

          <div>
            <label className="label">Security Question</label>
            <select
              name="securityQuestionKey"
              value={formData.securityQuestionKey}
              onChange={handleChange}
              className="input"
            >
              <option value="">Choose one question</option>
              {SECURITY_QUESTIONS.map((q) => (
                <option key={q.key} value={q.key}>{q.label}</option>
              ))}
            </select>
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
            />
          </div>

          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full btn-primary"
          >
            {registerMutation.isPending ? "Registering..." : "Create Account"}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-400 hover:text-blue-300">
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
          toast.success("🎉 Welcome to SimpleLet!");
          navigate("/");
        }}
      />
    </div>
  );
}
