import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  HomeIcon,
  HeartIcon,
  UserIcon,
  PlusCircleIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeSolid,
  HeartIcon as HeartSolid,
  UserIcon as UserSolid,
} from "@heroicons/react/24/solid";
import AuthPromptModal from "./AuthPromptModal";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [authModalConfig, setAuthModalConfig] = useState({ isOpen: false, title: "", message: "" });

  const navItems = [
    { name: "Explore", path: "/", icon: HomeIcon, activeIcon: HomeSolid },
    { name: "Favorites", path: "/favorites", icon: HeartIcon, activeIcon: HeartSolid, protected: true },
    { name: "Dashboard", path: "/dashboard", icon: UserIcon, activeIcon: UserSolid, protected: true },
  ];

  const handleNavClick = (item) => {
    if (item.protected && !token) {
      setAuthModalConfig({
        isOpen: true,
        title: `Access Your ${item.name}`,
        message: `Log in or sign up to view and manage your ${item.name.toLowerCase()}.`,
      });
      return;
    }
    navigate(item.path);
  };

  const handlePostClick = () => {
    if (!token) {
      setAuthModalConfig({
        isOpen: true,
        title: "Wanna Post a Listing?",
        message: "Log in or create an account to list your property.",
      });
      return;
    }
    navigate("/create-listing");
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/") return "Explore Properties";
    if (path.startsWith("/listing/")) return "Property Details";
    return path.replace("/", "").replace("-", " ");
  };

  return (
    <>
      {/* Top Header with Location / Breadcrumbs & Action Button */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/10 px-4 py-3 text-white">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            {location.pathname !== "/" && (
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition cursor-pointer"
                aria-label="Go back"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
            )}
            <span className="text-sm font-semibold capitalize tracking-wide text-gray-200">
              {getPageTitle()}
            </span>
          </div>

          <button
            onClick={handlePostClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer"
          >
            <PlusCircleIcon className="w-4 h-4" />
            <span>Post</span>
          </button>
        </div>
      </header>

      {/* Bottom Navigation Bar for Mobile */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#0a0a0a] border-t border-white/10 py-2.5 px-6 sm:hidden">
        <div className="flex justify-around items-center">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = isActive ? item.activeIcon : item.icon;

            return (
              <button
                key={item.name}
                onClick={() => handleNavClick(item)}
                className={`flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                  isActive ? "text-blue-400" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <Icon className="w-6 h-6" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Auth Prompt Modal for Protected Routes */}
      <AuthPromptModal
        isOpen={authModalConfig.isOpen}
        onClose={() => setAuthModalConfig((prev) => ({ ...prev, isOpen: false }))}
        title={authModalConfig.title}
        message={authModalConfig.message}
      />
    </>
  );
}
