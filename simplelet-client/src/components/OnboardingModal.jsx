// src/components/OnboardingModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Search, 
  Home, 
  Camera, 
  ShieldCheck, 
  Smartphone 
} from 'lucide-react';

const TOUR_STEPS = [
  {
    step: 1,
    badge: "Welcome",
    title: "Welcome to SimpleLet!",
    description: "Your trusted platform for finding and listing properties in Kenya. Let us show you around!",
    icon: Sparkles,
    meaning: "This is a friendly introduction letting you know you're on a property platform specifically for Kenya, and we're going to give you a quick tour of how everything works."
  },
  {
    step: 2,
    badge: "Search",
    title: "Browse Properties",
    description: "Explore available properties with our smart search. Use filters to find exactly what you're looking for.",
    icon: Search,
    meaning: "You can search for properties using the search bar. You can also filter by house type, location, price range, and sort by newest or price. There's also a 'Nearby' feature that shows properties close to your current location."
  },
  {
    step: 3,
    badge: "Inspect",
    title: "🏠 View Property Details",
    description: "Tap any listing to see full details, photos, location map, and contact the seller directly.",
    icon: Home,
    meaning: "When you click on any property card, you'll see all the details - photos, description, price, location on a map, and the contact number of the person who posted it. You can also leave comments and read reviews from other users."
  },
  {
    step: 4,
    badge: "Listing",
    title: "Post Your Property",
    description: "Have a property to rent? Take photos with your camera, drop a pin on the map, and post your listing in minutes.",
    icon: Camera,
    meaning: "If you're a landlord or caretaker with a property to rent, you can create a listing. You'll need to take photos with your phone's camera (no gallery uploads allowed - this prevents photo theft). You'll also drop a pin on the map to show exactly where the property is located. The whole process takes just a few minutes."
  },
  {
    step: 5,
    badge: "Security",
    title: "🔒 Built on Trust",
    description: "We verify photos with location tracking, watermark images, and let users review properties and posters.",
    icon: ShieldCheck,
    meaning: "SimpleLet has several safety features built in. Every photo you take includes GPS location to verify you're actually at the property. Each image gets a watermark with your name to prevent theft. Users can leave reviews and ratings for both properties and the people who post them. If anything seems suspicious, you can report it."
  },
  {
    step: 6,
    badge: "Responsive",
    title: "Works on Any Device",
    description: "SimpleLet is fully responsive. Use it on your phone, tablet, or desktop - it works everywhere.",
    icon: Smartphone,
    meaning: "You can use SimpleLet on any device. It works perfectly on phones, tablets, laptops, and desktops. Everything is optimized for mobile viewing because most users will be browsing from their phones."
  }
];

export default function OnboardingModal({ forceShow = false, onClose = () => {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("simplelet_has_seen_tour");
    if (!hasSeenTour || forceShow) {
      setIsOpen(true);
    }
  }, [forceShow]);

  const handleClose = () => {
    localStorage.setItem("simplelet_has_seen_tour", "true");
    setIsOpen(false);
    onClose();
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  if (!isOpen) return null;

  const current = TOUR_STEPS[currentStep];
  const IconComponent = current.icon;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-lg bg-[#0a0a0a]/95 rounded-2xl shadow-2xl border border-white/10 overflow-hidden transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="h-28 bg-gradient-to-r from-blue-900/40 via-blue-800/30 to-black p-6 flex justify-between items-start text-white relative border-b border-white/10">
          <div className="flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase">
            <span>Step {current.step} of {TOUR_STEPS.length}</span>
            <span>•</span>
            <span>{current.badge}</span>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-colors border border-white/10"
            title="Skip Tour"
          >
            <X size={16} />
          </button>

          <div className="absolute -bottom-6 left-6 p-3 bg-[#0a0a0a] rounded-xl shadow-xl border border-white/10 text-blue-400">
            <IconComponent size={28} />
          </div>
        </div>

        {/* Content Section */}
        <div className="pt-10 px-6 pb-6">
          <h2 className="text-xl font-bold text-white mb-2">
            {current.title}
          </h2>

          <p className="text-gray-300 font-medium text-sm leading-relaxed mb-4">
            "{current.description}"
          </p>

          <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 text-xs text-gray-400 mb-6">
            <span className="font-semibold text-blue-400">What it means: </span>
            {current.meaning}
          </div>

          {/* Pagination & Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentStep 
                      ? 'w-6 bg-blue-500' 
                      : 'w-2 bg-white/20 hover:bg-white/40'
                  }`}
                  aria-label={`Go to step ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 text-sm font-medium transition-colors flex items-center gap-1 border border-transparent hover:border-white/10"
                >
                  <ChevronLeft size={16} /> Back
                </button>
              )}

              <button
                onClick={handleNext}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-semibold transition-all flex items-center gap-1 shadow-lg shadow-blue-500/20"
              >
                {isLastStep ? (
                  "Get Started!"
                ) : (
                  <> Next <ChevronRight size={16} /> </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
