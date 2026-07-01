// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import API from "../services/api";

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

  const sendCodeMutation = useMutation({
    mutationFn: sendLoginCode,
    onSuccess: (data) => {
      toast.success(
        data.message || "Verification code sent! Check your phone.",
      );
      setStep(2);
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.error || "Failed to send code";
      toast.error(errorMsg);

      if (error.response?.status === 404) {
        toast.error("No account found with this phone number");
        setTimeout(() => navigate("/register"), 2000);
      }
    },
  });

  const loginMutation = useMutation({
    mutationFn: verifyAndLogin,
    onSuccess: (data) => {
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast.success("Login successful!");
      navigate("/");
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.error || "Verification failed";
      toast.error(errorMsg);
      if (errorMsg.includes("expired")) {
        setStep(1);
      }
    },
  });

  const handleSendCode = (e) => {
    e.preventDefault();
    if (!phone || !password) {
      toast.error("Please enter your phone number and password");
      return;
    }
    sendCodeMutation.mutate({ phone, password });
  };

  const handleVerify = (e) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }
    loginMutation.mutate({ phone, code });
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-6 sm:p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-center mb-6 heading-gradient">
          Login to SimpleLet
        </h2>

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="space-y-4">
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
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition"
                >
                  {showPassword ? "🙈" : "👁️"}
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
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="123456"
                maxLength={6}
                className="input text-center text-2xl tracking-widest font-mono"
                required
                autoFocus
              />
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
          </form>
        )}

        <p className="text-center text-sm text-gray-400 mt-6">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-blue-400 hover:text-blue-300 transition"
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
