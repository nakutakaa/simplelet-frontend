import { useNavigate } from "react-router-dom";
import { XMarkIcon, UserPlusIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";

export default function AuthPromptModal({
  isOpen,
  onClose,
  title = "Join SimpleLet",
  message = "Create an account or login to perform this action.",
}) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-2xl bg-[#121212] border border-white/10 p-6 shadow-2xl text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition"
          aria-label="Close modal"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        <div className="text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30">
            🏠
          </div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="text-xs text-gray-400">{message}</p>
        </div>

        <div className="mt-6 space-y-2.5">
          <button
            onClick={() => {
              onClose();
              navigate("/login");
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            Log In
          </button>

          <button
            onClick={() => {
              onClose();
              navigate("/register");
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white/10 hover:bg-white/20 text-gray-200 border border-white/10 font-semibold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
          >
            <UserPlusIcon className="w-4 h-4" />
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}
