// src/components/Layout.jsx
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="bg-[#0a0a0a] border-b border-white/5 sticky top-0 z-50 backdrop-blur-xl bg-black/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="hover:opacity-80 transition group">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-white to-red-400 bg-clip-text text-transparent">
                SimpleLet
              </h1>
              <p className="text-xs text-gray-400 group-hover:text-gray-300 transition">
                Simple property listings. No clutter.
              </p>
            </Link>

            <div className="flex gap-3 items-center">
              {token ? (
                <>
                  <Link
                    to="/favorites"
                    className="text-gray-300 hover:text-white transition text-sm"
                  >
                    Favorites
                  </Link>
                  <Link
                    to="/dashboard"
                    className="text-gray-300 hover:text-white transition text-sm"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    className="text-gray-300 hover:text-white transition text-sm"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/create-listing"
                    className="btn-primary text-sm hidden sm:inline-block"
                  >
                    + Post Ad
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="btn-outline text-sm"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-outline text-sm">
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary text-sm">
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
      <footer className="bg-[#0a0a0a] border-t border-white/5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © 2026 SimpleLet. Made with ❤️
            </p>
            <div className="flex gap-6 text-sm text-gray-400">
              <span className="hover:text-white transition cursor-pointer">
                About
              </span>
              <span className="hover:text-white transition cursor-pointer">
                Privacy
              </span>
              <span className="hover:text-white transition cursor-pointer">
                Terms
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
