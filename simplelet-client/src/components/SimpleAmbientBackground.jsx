// src/components/SimpleAmbientBackground.jsx
import { useState, useEffect, useRef } from "react";

const SimpleAmbientBackground = ({
  imageUrl,
  children,
  className = "",
  intensity = 0.04, // Ultra subtle
  blur = 200, // Maximum blur for seamless blend
  darkMode = true,
  onColorChange = null,
}) => {
  const [bgColor, setBgColor] = useState("#0a0a0a");
  const [textColor, setTextColor] = useState("#ffffff");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [gradientColors, setGradientColors] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!imageUrl) {
      setBgColor("#0a0a0a");
      setTextColor("#ffffff");
      setIsLoaded(false);
      return;
    }

    if (isExtracting) return;

    const extractColors = async () => {
      setIsExtracting(true);

      try {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageUrl;

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          setTimeout(reject, 10000);
        });

        const canvas = document.createElement("canvas");
        const size = 30;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");

        ctx.drawImage(img, 0, 0, size, size);

        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;

        const colors = [];
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] > 128) {
            colors.push({
              r: data[i],
              g: data[i + 1],
              b: data[i + 2],
            });
          }
        }

        if (colors.length > 0) {
          const dominant = findDominantColor(colors);
          const accent = findAccentColor(colors, dominant);

          // Heavy darkening to blend with black theme
          const darkenFactor = 0.25;
          const mainColor = darkenColor(dominant, darkenFactor);
          const accentColor = darkenColor(
            accent || dominant,
            darkenFactor + 0.05,
          );

          const mainHex = rgbToHex(mainColor);
          const accentHex = rgbToHex(accentColor);

          setBgColor(mainHex);
          setGradientColors([mainHex, accentHex]);

          const brightness =
            (dominant.r * 299 + dominant.g * 587 + dominant.b * 114) / 1000;
          const textColor = brightness > 150 ? "#0a0a0a" : "#ffffff";
          setTextColor(textColor);

          setIsLoaded(true);

          if (onColorChange) {
            onColorChange({ color: mainHex, brightness, textColor });
          }
        } else {
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

    extractColors();

    return () => {
      setIsExtracting(false);
    };
  }, [imageUrl, onColorChange]);

  const findDominantColor = (colors) => {
    let r = 0,
      g = 0,
      b = 0;
    colors.forEach((c) => {
      r += c.r;
      g += c.g;
      b += c.b;
    });
    return {
      r: Math.round(r / colors.length),
      g: Math.round(g / colors.length),
      b: Math.round(b / colors.length),
    };
  };

  const findAccentColor = (colors, dominant) => {
    let maxDiff = 0;
    let accent = null;

    colors.forEach((c) => {
      const diff =
        Math.abs(c.r - dominant.r) +
        Math.abs(c.g - dominant.g) +
        Math.abs(c.b - dominant.b);
      if (diff > maxDiff) {
        maxDiff = diff;
        accent = c;
      }
    });

    return accent;
  };

  const darkenColor = (color, factor) => {
    return {
      r: Math.round(color.r * factor),
      g: Math.round(color.g * factor),
      b: Math.round(color.b * factor),
    };
  };

  const rgbToHex = (color) => {
    return `#${[color.r, color.g, color.b]
      .map((c) => Math.max(0, Math.min(255, c)))
      .map((c) => c.toString(16).padStart(2, "0"))
      .join("")}`;
  };

  const getGradientStyle = () => {
    if (gradientColors.length >= 2) {
      return {
        background: `linear-gradient(180deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`,
        color: textColor,
      };
    }
    return {
      backgroundColor: bgColor,
      color: textColor,
    };
  };

  return (
    <div
      ref={containerRef}
      className={`relative transition-all duration-1000 ease-in-out ${className}`}
      style={getGradientStyle()}
    >
      {/* ============ ULTRA SUBTLE AMBIENT GLOW (BLENDS WITH BLACK) ============ */}
      {isLoaded && (
        <>
          {/* Main glow - very faint whisper of color */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% 20%, ${bgColor}40 0%, transparent 80%)`,
              opacity: intensity * 1.2,
              filter: `blur(${blur}px)`,
            }}
          />

          {/* Secondary accent glow - barely there */}
          {gradientColors.length >= 2 && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at 60% 80%, ${gradientColors[1]}20 0%, transparent 70%)`,
                opacity: intensity * 0.6,
                filter: `blur(${blur * 1.3}px)`,
              }}
            />
          )}

          {/* Very gentle warm hint */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 30% 50%, ${bgColor}15 0%, transparent 60%)`,
              opacity: intensity * 0.3,
              filter: `blur(${blur * 0.9}px)`,
            }}
          />

          {/* Subtle pulse - almost invisible */}
          <div
            className="absolute inset-0 pointer-events-none animate-pulse-slow"
            style={{
              background: `radial-gradient(ellipse at 70% 40%, ${bgColor}10 0%, transparent 50%)`,
              opacity: intensity * 0.15,
              filter: `blur(${blur * 0.7}px)`,
            }}
          />
        </>
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>

      <style>{`
        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default SimpleAmbientBackground;
