import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

const DISMISSED_KEY = "simplelet_pwa_install_dismissed";

function isStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function isIosSafari() {
  if (typeof navigator === "undefined") {
    return false;
  }

  const userAgent = navigator.userAgent;
  const isIosDevice =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafariBrowser =
    /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS/.test(userAgent);

  return isIosDevice && isSafariBrowser;
}

function isAndroidChrome() {
  if (typeof navigator === "undefined") {
    return false;
  }

  const userAgent = navigator.userAgent;
  return /Android/.test(userAgent) && /Chrome/.test(userAgent);
}

function getDismissedState() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(DISMISSED_KEY) === "true";
}

function HomescreenIcon({ className = "h-6 w-6 shrink-0" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="simplelet-homescreen-gradient"
          x1="2"
          y1="2"
          x2="22"
          y2="22"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#60A5FA" />
          <stop offset="0.55" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#F87171" />
        </linearGradient>
      </defs>
      <path
        d="M4.75 9.5 12 3.75l7.25 5.75V18a2 2 0 0 1-2 2h-3.5v-5h-3.5v5h-3.5a2 2 0 0 1-2-2V9.5Z"
        stroke="url(#simplelet-homescreen-gradient)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 8.25v4.5m0 0-2-2m2 2 2-2"
        stroke="url(#simplelet-homescreen-gradient)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PwaInstallPrompt({ compact = false }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(isStandaloneMode);
  const [isDismissed, setIsDismissed] = useState(getDismissedState);
  const [showInstructions, setShowInstructions] = useState(false);
  const iosSafari = useMemo(() => isIosSafari(), []);
  const androidChrome = useMemo(() => isAndroidChrome(), []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsDismissed(false);
      setShowInstructions(false);
      window.localStorage.removeItem(DISMISSED_KEY);
      toast.success("📲 SimpleLet installed successfully!");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const dismissPrompt = () => {
    window.localStorage.setItem(DISMISSED_KEY, "true");
    setIsDismissed(true);
    setShowInstructions(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) {
      setShowInstructions(true);
      return;
    }

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      toast.success("📲 Installing SimpleLet...");
      setDeferredPrompt(null);
      return;
    }

    toast("Install canceled.");
  };

  if (isInstalled || isDismissed) {
    return null;
  }

  const actionLabel = deferredPrompt
    ? "Add to Home Screen"
    : "How to Add to Home Screen";

  return (
    <>
      {compact ? (
        <button
          onClick={handleInstall}
          className="btn-outline text-sm inline-flex items-center gap-2 whitespace-nowrap"
          title={actionLabel}
        >
          <HomescreenIcon className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">{actionLabel}</span>
          <span className="sm:hidden">Add App</span>
        </button>
      ) : (
        <div className="mb-6 rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/10 via-black to-purple-500/10 p-4 shadow-lg shadow-blue-500/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <HomescreenIcon />
                <p className="text-sm font-semibold text-white">
                  Add SimpleLet to Home Screen
                </p>
              </div>
              <p className="mt-1 text-sm text-gray-300">
                Open SimpleLet like an app straight from your phone home screen.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={handleInstall} className="btn-primary text-sm">
                {actionLabel}
              </button>
              <button onClick={dismissPrompt} className="btn-outline text-sm">
                Not now
              </button>
            </div>
          </div>
        </div>
      )}

      {showInstructions && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 shadow-2xl">
            <div className="mb-4 flex items-center gap-2">
              <HomescreenIcon />
              <h2 className="text-lg font-semibold text-white">
                Add SimpleLet to Home Screen
              </h2>
            </div>

            {iosSafari ? (
              <ol className="space-y-2 text-sm text-gray-300">
                <li>1. Tap the Share button in Safari.</li>
                <li>2. Scroll and tap Add to Home Screen.</li>
                <li>3. Tap Add to place SimpleLet on your home screen.</li>
              </ol>
            ) : androidChrome ? (
              <ol className="space-y-2 text-sm text-gray-300">
                <li>1. Tap the three-dot menu in Chrome.</li>
                <li>2. Tap Add to Home screen or Install app.</li>
                <li>3. Confirm by tapping Install/Add.</li>
              </ol>
            ) : (
              <ol className="space-y-2 text-sm text-gray-300">
                <li>1. Open the browser menu.</li>
                <li>2. Look for Install app or Add to Home screen.</li>
                <li>3. Confirm the install prompt from your browser.</li>
              </ol>
            )}

            <p className="mt-4 text-xs text-gray-400">
              If your browser still does not show the option, refresh the page
              once and try again.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowInstructions(false)}
                className="btn-outline text-sm"
              >
                Close
              </button>
              {deferredPrompt && (
                <button onClick={handleInstall} className="btn-primary text-sm">
                  Add Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
