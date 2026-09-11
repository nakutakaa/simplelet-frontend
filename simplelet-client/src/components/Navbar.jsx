// src/components/Navbar.jsx
import { useLocation, useNavigate, Link } from "react-router-dom";
import { HomeIcon, HeartIcon, UserIcon, PlusCircleIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";
import { HomeIcon as HomeSolid, HeartIcon as HeartSolid, UserIcon as UserSolid } from "@heroicons/react/24/solid";

export default function Navbar({ onOpenAuthModal }) {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const navItems = [
    { name: "Explore", path: "/", icon: HomeIcon, activeIcon: HomeSolid },
    { name: "Favorites", path: "/favorites", icon: HeartIcon, activeIcon: HeartSolid, protected: true },
    { name: "Dashboard", path: "/dashboard", icon: UserIcon, activeIcon: UserSolid, protected: true },
  ];

  const handleNavClick = (item) => {
    if (item.protected && !token) {
      onOpenAuthModal(`Log in to access ${item.name}`, `Save items and view your ${item.name.toLowerCase()} here.`);
      return;
    }
    navigate(item.path);
  };

  const handlePostClick = () => {
    if (!token) {
      onOpenAuthModal("Wanna post a listing?", "Log in or sign up to add your properties.");
      return;
    }
    navigate("/create-listing");
  };

  return (
    <>
      {/* Top Header with Back Navigation & Breadcrumb Info */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            {location.pathname !== "/" && (
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
            )}
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">
              {location.pathname === "/" ? "SimpleLet Explore" : location.pathname.replace("/", "").replace("-", " ")}
            </span>
          </div>

          <button
            onClick={handlePostClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-sm"
          >
            <PlusCircleIcon className="w-4 h-4" />
            <span>Post</span>
          </button>
        </div>
      </header>

      {/* Bottom Sticky Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-2 px-6 sm:hidden">
        <div className="flex justify-around items-center">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = isActive ? item.activeIcon : item.icon;

            return (
              <button
                key={item.name}
                onClick={() => handleNavClick(item)}
                className={`flex flex-col items-center gap-1 text-xs font-medium transition ${
                  isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                }`}
              >
                <Icon className="w-6 h-6" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
