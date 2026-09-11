// src/components/AuthPromptModal.jsx
import { useNavigate } from "react-router-dom";
import { XMarkIcon, UserPlusIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";

export default function AuthPromptModal({ isOpen, onClose, title = "Join SimpleLet", message = "Create an account or login to continue." }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        <div className="text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
            🏢
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{message}</p>
        </div>

        <div className="mt-6 space-y-2">
          <button
            onClick={() => {
              onClose();
              navigate("/login");
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            Log In
          </button>

          <button
            onClick={() => {
              onClose();
              navigate("/register");
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold text-sm rounded-xl transition"
          >
            <UserPlusIcon className="w-4 h-4" />
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}
