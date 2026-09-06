// src/components/Layout.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import SocketStatusDot from "./SocketStatusDot";
import PwaInstallPrompt from "./PwaInstallPrompt";
import slateBg from "../assets/images/slate-bg.jpg";

export default function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    setMobileMenuOpen(false);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-black flex flex-col overflow-x-hidden text-gray-100">
      {/* Header */}
      <header
        className="sticky top-0 z-40 border-b border-white/15 bg-cover bg-center bg-no-repeat shadow-2xl relative"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.85)), url(${slateBg})`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            {/* Logo */}
            <Link to="/" className="hover:opacity-80 transition group flex flex-col">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 via-white to-red-400 bg-clip-text text-transparent drop-shadow-md">
                SimpleLet
              </h1>
              <p className="text-[10px] sm:text-xs text-gray-300 group-hover:text-white transition drop-shadow">
                Simple property listings.
              </p>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex gap-4 items-center">
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
                    className="btn-primary text-sm px-3 py-1.5 rounded-lg shadow-lg"
                  >
                    + Post Ad
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="btn-outline text-sm px-3 py-1.5 rounded-lg shadow-md border border-white/20 hover:bg-white/10"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-outline text-sm shadow-md px-3 py-1.5 rounded-lg border border-white/20">
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="btn-primary text-sm shadow-lg px-3 py-1.5 rounded-lg"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Actions & Hamburger Toggle */}
            <div className="flex items-center gap-2 md:hidden">
              <SocketStatusDot />
              <PwaInstallPrompt compact />
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 text-gray-200 hover:text-white focus:outline-none bg-white/5 rounded-lg border border-white/10"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Pop-up Modal with Backdrop Blur */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            className="w-full max-w-sm bg-[#0a0a0a]/95 border border-white/15 rounded-2xl p-6 shadow-2xl relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <span className="text-lg font-bold text-white">Menu</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-colors border border-white/10"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation Options */}
            <div className="space-y-2">
              {token ? (
                <>
                  <Link
                    to="/favorites"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-gray-200 hover:text-white py-2.5 px-3 rounded-lg hover:bg-white/5 transition"
                  >
                    ⭐ Favorites
                  </Link>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-gray-200 hover:text-white py-2.5 px-3 rounded-lg hover:bg-white/5 transition"
                  >
                    📊 Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-gray-200 hover:text-white py-2.5 px-3 rounded-lg hover:bg-white/5 transition"
                  >
                    👤 Profile
                  </Link>
                  <div className="pt-2 flex flex-col gap-2">
                    <Link
                      to="/create-listing"
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn-primary w-full text-center py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/20"
                    >
                      + Post Ad
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full py-2.5 text-center text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl font-medium hover:bg-red-500/20 transition"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="pt-2 flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 text-gray-200 border border-white/20 rounded-xl font-medium hover:bg-white/5 transition"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-primary w-full text-center py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/20"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 w-full">
        {children}
      </main>

      {/* Footer */}
      <footer
        className="border-t border-white/15 mt-auto bg-cover bg-center bg-no-repeat relative shadow-2xl"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.9)), url(${slateBg})`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-300 text-xs sm:text-sm font-medium drop-shadow text-center md:text-left">
              © 2026 SimpleLet. Made with ❤️
            </p>
            <div className="flex gap-6 text-xs sm:text-sm text-gray-300 font-medium">
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
