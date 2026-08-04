// src/components/SimpleAmbientBackground.jsx
import { useState, useEffect, useRef } from "react";

const SimpleAmbientBackground = ({
  imageUrl,
  children,
  className = "",
  intensity = 0.25,
  blur = 80,
  darkMode = true,
  onColorChange = null,
}) => {
  const [bgColor, setBgColor] = useState("#0a0a0a");
  const [textColor, setTextColor] = useState("#ffffff");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    // If no image, use default dark
    if (!imageUrl) {
      setBgColor("#0a0a0a");
      setTextColor("#ffffff");
      setIsLoaded(false);
      return;
    }

    // Prevent multiple extractions
    if (isExtracting) return;

    const extractColor = async () => {
      setIsExtracting(true);

      try {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageUrl;

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          // Timeout fallback
          setTimeout(reject, 10000);
        });

        // Create canvas to extract color
        const canvas = document.createElement("canvas");
        const size = 20;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");

        // Draw image scaled down (faster processing)
        ctx.drawImage(img, 0, 0, size, size);

        // Get pixel data
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;

        // Calculate average color (ignoring transparent pixels)
        let r = 0,
          g = 0,
          b = 0,
          count = 0;

        for (let i = 0; i < data.length; i += 4) {
          // Only count non-transparent pixels
          if (data[i + 3] > 128) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
          }
        }

        if (count > 0) {
          r = Math.round(r / count);
          g = Math.round(g / count);
          b = Math.round(b / count);

          // Darken the color slightly for better readability
          const darkenFactor = 0.7;
          r = Math.round(r * darkenFactor);
          g = Math.round(g * darkenFactor);
          b = Math.round(b * darkenFactor);

          const hex = `#${[r, g, b]
            .map((c) => Math.max(0, Math.min(255, c)))
            .map((c) => c.toString(16).padStart(2, "0"))
            .join("")}`;

          setBgColor(hex);

          // Determine text color based on background brightness
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          const textColor = brightness > 150 ? "#0a0a0a" : "#ffffff";
          setTextColor(textColor);

          setIsLoaded(true);

          // Callback if provided
          if (onColorChange) {
            onColorChange({ color: hex, brightness, textColor });
          }
        } else {
          // Fallback if no pixels found
          setBgColor("#0a0a0a");
          setTextColor("#ffffff");
          setIsLoaded(false);
        }
      } catch (error) {
        console.debug("Ambient color extraction failed:", error.message);
        setBgColor("#0a0a0a");
        setTextColor("#ffffff");
        setIsLoaded(false);
      } finally {
        setIsExtracting(false);
      }
    };

    extractColor();

    // Cleanup
    return () => {
      setIsExtracting(false);
    };
  }, [imageUrl, onColorChange]);

  return (
    <div
      ref={containerRef}
      className={`relative transition-colors duration-700 ${className}`}
      style={{
        backgroundColor: isLoaded ? bgColor : "#0a0a0a",
        color: textColor,
      }}
    >
      {/* Ambient glow effect */}
      {isLoaded && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${bgColor}66 0%, transparent 70%)`,
            opacity: intensity,
            filter: `blur(${blur}px)`,
          }}
        />
      )}

      {/* Subtle gradient overlay */}
      {isLoaded && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, ${bgColor}33 0%, transparent 50%, ${bgColor}22 100%)`,
            opacity: 0.3,
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default SimpleAmbientBackground;
