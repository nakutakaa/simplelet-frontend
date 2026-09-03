// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import PageErrorBoundary from "./components/PageErrorBoundary";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RecoveryPage from "./pages/RecoveryPage";
import VerifyPage from "./pages/VerifyPage";
import DashboardPage from "./pages/DashboardPage";
import CreateListingPage from "./pages/CreateListingPage";
import EditListingPage from "./pages/EditListingPage";
import ListingDetailPage from "./pages/ListingDetailPage";
import ProfilePage from "./pages/ProfilePage";
import FavoritesPage from "./pages/FavoritesPage";
import LocationPermission from "./components/LocationPermission";
import OnboardingModal from "./components/OnboardingModal"; // <-- Imported Onboarding Modal
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
    <ErrorBoundary>
      <BrowserRouter>
        <Layout>
          {/* First-time Onboarding Modal */}
          <OnboardingModal />

          {/* Location Permission Prompt */}
          <LocationPermission
            onLocationGranted={handleLocationGranted}
            onLocationDenied={handleLocationDenied}
          />

          <Routes>
            {/* PUBLIC ROUTES */}
            <Route
              path="/"
              element={
                <PageErrorBoundary>
                  <HomePage />
                </PageErrorBoundary>
              }
            />
            <Route
              path="/listing/:id"
              element={
                <PageErrorBoundary>
                  <ListingDetailPage />
                </PageErrorBoundary>
              }
            />

            {/* AUTH ROUTES */}
            <Route
              path="/login"
              element={
                <PageErrorBoundary>
                  <LoginPage />
                </PageErrorBoundary>
              }
            />
            <Route
              path="/register"
              element={
                <PageErrorBoundary>
                  <RegisterPage />
                </PageErrorBoundary>
              }
            />
            <Route
              path="/verify"
              element={
                <PageErrorBoundary>
                  <VerifyPage />
                </PageErrorBoundary>
              }
            />
            <Route
              path="/recover-password"
              element={
                <PageErrorBoundary>
                  <RecoveryPage />
                </PageErrorBoundary>
              }
            />

            {/* PROTECTED ROUTES */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requireVerified={true}>
                  <PageErrorBoundary>
                    <DashboardPage />
                  </PageErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-listing"
              element={
                <ProtectedRoute requireVerified={true}>
                  <PageErrorBoundary>
                    <CreateListingPage />
                  </PageErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-listing/:id"
              element={
                <ProtectedRoute requireVerified={true}>
                  <PageErrorBoundary>
                    <EditListingPage />
                  </PageErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute requireVerified={true}>
                  <PageErrorBoundary>
                    <ProfilePage />
                  </PageErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/favorites"
              element={
                <ProtectedRoute requireVerified={true}>
                  <PageErrorBoundary>
                    <FavoritesPage />
                  </PageErrorBoundary>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
