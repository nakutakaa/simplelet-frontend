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

  if (status === 401) return "Invalid phone number or password.";
  if (status === 404) return "Account not found. Please register first.";
  if (!error.response) return "Network error. Please check your connection.";

  return data?.message || data?.error || "Login failed. Please try again.";
};

const formatKenyanPhone = (input) => {
  let cleaned = input.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.slice(1);
  } else if (cleaned.startsWith("7") || cleaned.startsWith("1")) {
    cleaned = "254" + cleaned;
  }
  if (!cleaned.startsWith("+") && cleaned.length > 0) {
    cleaned = "+" + cleaned;
  }
  return cleaned;
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
  const [showPhoneLogin, setShowPhoneLogin] = useState(false);
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
        toast.success("Welcome back to SimpleLet!");
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
    const formatted = formatKenyanPhone(e.target.value);
    setPhone(formatted);
    if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: null }));
  };

  const handleLogin = (e) => {
    e.preventDefault();

    if (!phone) {
      setFieldErrors({ phone: "Please enter your phone number." });
      return;
    }
    if (!phone.match(/^\+254[0-9]{9}$/)) {
      setFieldErrors({ phone: "Invalid format (+254XXXXXXXXX)" });
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
    <div className="max-w-md mx-auto">
      <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-6 sm:p-8 shadow-xl space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-white">Login to SimpleLet</h2>
          <p className="text-gray-400 text-sm">Access your account and manage listings</p>
        </div>

        <SafetyTip page="login" />

        {/* Hero Google Auth Option */}
        <div className="bg-[#121212] p-4 rounded-xl border border-blue-500/30 text-center space-y-3">
          <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider">Fastest & Recommended</p>
          <div className="flex justify-center w-full">
            {googleAuthMutation.isPending ? (
              <div className="py-2 text-sm text-gray-400 animate-pulse">Authenticating with Google...</div>
            ) : (
              <GoogleLogin
                onSuccess={(res) => res.credential && googleAuthMutation.mutate(res.credential)}
                onError={() => toast.error("Google Sign-In failed or popup was closed.")}
                theme="filled_blue"
                shape="pill"
                width="100%"
              />
            )}
          </div>
        </div>

        {/* Toggle Button for Phone Login */}
        {!showPhoneLogin ? (
          <button
            onClick={() => setShowPhoneLogin(true)}
            className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl border border-white/10 text-xs font-medium transition"
          >
            Don't have a Google Account? Login with phone
          </button>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4 pt-2 border-t border-white/10">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="label">Phone Number</label>
                {phone && <span className="text-[10px] text-blue-400 font-mono">{phone}</span>}
              </div>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="0712345678 or +254712345678"
                className="input focus:border-blue-500"
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
                  className="input pr-12 focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-blue-400 hover:text-blue-300"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {fieldErrors.password && <p className="text-red-400 text-[10px] mt-1">{fieldErrors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm transition"
            >
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <p className="text-sm text-gray-400">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium">
              Register here
            </Link>
          </p>
        </div>
      </div>

      <PhonePromptModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onSuccess={() => {
          toast.success("Welcome back to SimpleLet!");
          navigate("/");
        }}
      />
    </div>
  );
}
