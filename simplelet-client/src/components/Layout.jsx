// src/components/Layout.jsx
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import SocketStatusDot from "./SocketStatusDot";
import PwaInstallPrompt from "./PwaInstallPrompt";
import slateBg from "../assets/images/slate-bg.jpg";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b border-white/15 bg-cover bg-center bg-no-repeat shadow-2xl relative"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.65)), url(${slateBg})`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="hover:opacity-80 transition group">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-white to-red-400 bg-clip-text text-transparent drop-shadow-md">
                SimpleLet
              </h1>
              <p className="text-xs text-gray-300 group-hover:text-white transition drop-shadow">
                Simple property listings. No clutter.
              </p>
            </Link>

            <div className="flex gap-3 items-center">
              {/* Live socket status — shows for logged-in users */}
              <SocketStatusDot />
              <PwaInstallPrompt compact />
              {token ? (
                <>
                  <Link
                    to="/favorites"
                    className="text-gray-200 hover:text-white font-medium transition text-sm drop-shadow"
                  >
                    Favorites
                  </Link>
                  <Link
                    to="/dashboard"
                    className="text-gray-200 hover:text-white font-medium transition text-sm drop-shadow"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    className="text-gray-200 hover:text-white font-medium transition text-sm drop-shadow"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/create-listing"
                    className="btn-primary text-sm hidden sm:inline-block shadow-lg"
                  >
                    + Post Ad
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="btn-outline text-sm shadow-md"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-outline text-sm shadow-md">
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="btn-primary text-sm shadow-lg"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>

      {/* Footer */}
      <footer
        className="border-t border-white/15 mt-auto bg-cover bg-center bg-no-repeat relative shadow-2xl"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(${slateBg})`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-300 text-sm font-medium drop-shadow">
              © 2026 SimpleLet. Made with ❤️
            </p>
            <div className="flex gap-6 text-sm text-gray-300 font-medium">
              <span className="hover:text-white transition cursor-pointer drop-shadow">
                About
              </span>
              <span className="hover:text-white transition cursor-pointer drop-shadow">
                Privacy
              </span>
              <span className="hover:text-white transition cursor-pointer drop-shadow">
                Terms
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
