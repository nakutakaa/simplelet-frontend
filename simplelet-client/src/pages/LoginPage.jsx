// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { GoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";
import API from "../services/api";
import SafetyTip from "../components/SafetyTip";
import PhonePromptModal from "../components/PhonePromptModal";

const getErrorMessage = (error) => {
  const status = error.response?.status;
  const data = error.response?.data;

  if (status === 401) return "❌ Invalid phone number or password.";
  if (status === 404) return "❌ Account not found. Please register first.";
  if (!error.response) return "📡 Network error. Please check your connection.";

  return data?.message || data?.error || "❌ Login failed. Please try again.";
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

  const googleAuthMutation = useMutation({
    mutationFn: verifyGoogleToken,
    onSuccess: (data) => {
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (!data.user.phone) {
        setShowPhoneModal(true);
      } else {
        toast.success("🎉 Welcome back to SimpleLet!");
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
        toast.success("🎉 Login successful!");
        navigate("/");
      }
    },
    onError: (error) => {
      const errorMsg = getErrorMessage(error);
      setFieldErrors({ general: errorMsg });
      toast.error(errorMsg);
    },
  });

  const handleLogin = (e) => {
    e.preventDefault();

    if (!phone) {
      setFieldErrors({ phone: "📱 Please enter your phone number." });
      return;
    }
    if (!phone.match(/^\+254[0-9]{9}$/)) {
      setFieldErrors({ phone: "📱 Invalid format (+254XXXXXXXXX)" });
      return;
    }
    if (!password) {
      setFieldErrors({ password: "🔑 Please enter your password." });
      return;
    }

    setFieldErrors({});
    loginMutation.mutate({ phone, password });
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
                Or login with phone
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="label">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full btn-primary"
          >
            {loginMutation.isPending ? "Logging in..." : "Login"}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-400">
              Don't have an account?{" "}
              <Link to="/register" className="text-blue-400 hover:text-blue-300">
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
          toast.success("🎉 Welcome back to SimpleLet!");
          navigate("/");
        }}
      />
    </div>
  );
}
