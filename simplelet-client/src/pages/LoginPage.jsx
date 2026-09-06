// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { GoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";
import API from "../services/api";
import SafetyTip from "../components/SafetyTip";
import PhonePromptModal from "../components/PhonePromptModal";
import { EyeIcon, EyeSlashIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

const getErrorMessage = (error) => {
  const status = error.response?.status;
  const data = error.response?.data;

  if (status === 401) return "Invalid phone number or password.";
  if (status === 404) return "Account not found. Please register first.";
  if (!error.response) return "Network error. Please check your connection.";

  return data?.message || data?.error || "Login failed. Please try again.";
};

const directLoginUser = async ({ phone, password }) => {
  const { data } = await API.post("/auth/login", { phone, password });
  return data;
};

const verifyGoogleToken = async (token) => {
  const { data } = await API.post("/auth/google", { token });
  return data;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  const isPhoneValid = /^\+254[0-9]{9}$/.test(phone);

  const googleAuthMutation = useMutation({
    mutationFn: verifyGoogleToken,
    onSuccess: (data) => {
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (!data.user.phone) {
        setShowPhoneModal(true);
      } else {
        toast.success("Welcome back!");
        navigate("/");
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const loginMutation = useMutation({
    mutationFn: directLoginUser,
    onSuccess: (data) => {
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (!data.user.phone) {
        setShowPhoneModal(true);
      } else {
        toast.success("Login successful!");
        navigate("/");
      }
    },
    onError: (error) => {
      const errorMsg = getErrorMessage(error);
      setFieldErrors({ general: errorMsg });
      toast.error(errorMsg);
    },
  });

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    setPhone(val);
    if (fieldErrors.phone) {
      setFieldErrors((prev) => ({ ...prev, phone: null }));
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: null }));
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();

    if (!phone) {
      setFieldErrors({ phone: "Please enter your phone number." });
      return;
    }
    if (!isPhoneValid) {
      setFieldErrors({ phone: "Format must be +254XXXXXXXXX (9 digits)" });
      return;
    }
    if (!password) {
      setFieldErrors({ password: "Please enter your password." });
      return;
    }

    setFieldErrors({});
    loginMutation.mutate({ phone, password });
  };

  return (
    <div className="max-w-md mx-auto my-8 px-4">
      <div className="bg-[#121212] rounded-2xl border border-white/10 p-6 sm:p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-center mb-2 text-white">
          Login to SimpleLet
        </h2>
        <p className="text-center text-gray-400 text-sm mb-6">
          Access your account and manage listings
        </p>

        <SafetyTip page="login" className="mb-6" />

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
                Or login with phone
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Phone Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
              Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="+254712345678"
                className={`w-full bg-black/40 border ${
                  fieldErrors.phone
                    ? "border-red-500/80 focus:border-red-500"
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
              <p className="text-[11px] text-gray-500 mt-1">Include Kenyan country code: +254</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter your password"
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
            {fieldErrors.password && <p className="text-red-400 text-xs mt-1.5">{fieldErrors.password}</p>}
          </div>

          {/* Submit CTA Button */}
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 text-white font-bold py-3.5 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-blue-600/20"
          >
            {loginMutation.isPending ? "Logging in..." : "Login"}
          </button>

          <div className="text-center pt-2">
            <p className="text-sm text-gray-400">
              Don't have an account?{" "}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium underline">
                Register here
              </Link>
            </p>
          </div>
        </form>
      </div>

      <PhonePromptModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onSuccess={() => {
          toast.success("Welcome back!");
          navigate("/");
        }}
      />
    </div>
  );
}
