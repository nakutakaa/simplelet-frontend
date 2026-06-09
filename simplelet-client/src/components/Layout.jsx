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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="hover:opacity-80 transition">
              <h1 className="text-2xl font-bold text-primary-600">SimpleLet</h1>
              <p className="text-sm text-gray-500">
                Simple property listings. No clutter.
              </p>
            </Link>

            <div className="flex gap-3 items-center">
              {token ? (
                <>
                  <Link
                    to="/dashboard"
                    className="text-gray-600 hover:text-primary-600 transition"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/create-listing"
                    className="text-gray-600 hover:text-primary-600 transition"
                  >
                    Post Ad
                  </Link>
                  <button onClick={handleLogout} className="btn-outline">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-outline">
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary">
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
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          <p>© 2026 SimpleLet. Simple property listings. No clutter.</p>
        </div>
      </footer>
    </div>
  );
}
