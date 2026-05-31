// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import API from "../services/api";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

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
    onSuccess: () => {
      toast.success("Verification code sent! Check your phone.");
      setStep(2);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to send code");
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
      toast.error(error.response?.data?.error || "Verification failed");
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
      <div className="bg-white rounded-xl shadow-sm p-8">
        <h2 className="text-2xl font-bold text-center mb-6">
          Login to SimpleLet
        </h2>

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
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
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={sendCodeMutation.isPending}
              className="w-full btn-primary disabled:opacity-50"
            >
              {sendCodeMutation.isPending
                ? "Sending code..."
                : "Send Verification Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                We sent a code to <strong>{phone}</strong>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verification Code
              </label>
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
              className="w-full btn-primary disabled:opacity-50"
            >
              {loginMutation.isPending ? "Verifying..." : "Verify & Login"}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              ← Use different phone number
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-primary-600 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
