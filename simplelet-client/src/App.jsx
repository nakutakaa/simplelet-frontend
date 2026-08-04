// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyPage from "./pages/VerifyPage";
import DashboardPage from "./pages/DashboardPage";
import CreateListingPage from "./pages/CreateListingPage";
import EditListingPage from "./pages/EditListingPage";
import ListingDetailPage from "./pages/ListingDetailPage";
import ProfilePage from "./pages/ProfilePage";
import FavoritesPage from "./pages/FavoritesPage";
import LocationPermission from "./components/LocationPermission";
import "leaflet/dist/leaflet.css";

function App() {
  const [userLocation, setUserLocation] = useState(null);
  const [hasGrantedLocation, setHasGrantedLocation] = useState(false);

  const handleLocationGranted = (location) => {
    setUserLocation(location);
    setHasGrantedLocation(true);
    localStorage.setItem("userLocation", JSON.stringify(location));
    console.log("📍 Location granted:", location);
  };

  const handleLocationDenied = () => {
    setHasGrantedLocation(false);
    const stored = localStorage.getItem("userLocation");
    if (stored) {
      try {
        setUserLocation(JSON.parse(stored));
      } catch (e) {
        // ignore
      }
    }
  };

  // Check stored location on mount
  useEffect(() => {
    const stored = localStorage.getItem("userLocation");
    if (stored) {
      try {
        setUserLocation(JSON.parse(stored));
        setHasGrantedLocation(true);
      } catch (e) {
        // ignore
      }
    }
  }, []);

  return (
    <BrowserRouter>
      <Layout>
        {/* Location Permission Prompt */}
        <LocationPermission
          onLocationGranted={handleLocationGranted}
          onLocationDenied={handleLocationDenied}
        />

        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/" element={<HomePage />} />
          <Route path="/listing/:id" element={<ListingDetailPage />} />

          {/* AUTH ROUTES */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify" element={<VerifyPage />} />

          {/* PROTECTED ROUTES */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requireVerified={true}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-listing"
            element={
              <ProtectedRoute requireVerified={true}>
                <CreateListingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-listing/:id"
            element={
              <ProtectedRoute requireVerified={true}>
                <EditListingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute requireVerified={true}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute requireVerified={true}>
                <FavoritesPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
