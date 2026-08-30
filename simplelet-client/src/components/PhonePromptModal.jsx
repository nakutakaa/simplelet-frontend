// src/components/PhonePromptModal.jsx
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import API from "../services/api";

const updatePhone = async (phone) => {
  const { data } = await API.put("/user/profile", { phone });
  return data;
};

export default function PhonePromptModal({ isOpen, onClose, onSuccess }) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const phoneMutation = useMutation({
    mutationFn: updatePhone,
    onSuccess: (updatedUser) => {
      localStorage.setItem("user", JSON.stringify(updatedUser));
      toast.success("Phone number saved successfully!");
      if (onSuccess) onSuccess(updatedUser);
      onClose();
    },
    onError: (err) => {
      const msg = err.response?.data?.error || "Failed to update phone number.";
      setError(msg);
      toast.error(msg);
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!phone.match(/^\+254[0-9]{9}$/)) {
      setError("Please enter a valid phone number (+254XXXXXXXXX)");
      return;
    }
    setError("");
    phoneMutation.mutate(phone);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <h3 className="text-xl font-bold heading-gradient mb-2">Phone Number Required</h3>
        <p className="text-gray-400 text-sm mb-4">
          Please add your Kenyan phone number (+254...) so potential clients or buyers can contact you.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (error) setError("");
              }}
              placeholder="+254712345678"
              className="input"
              required
            />
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={phoneMutation.isPending}
            className="w-full btn-primary"
          >
            {phoneMutation.isPending ? "Saving..." : "Save Phone Number"}
          </button>
        </form>
      </div>
    </div>
  );
}
