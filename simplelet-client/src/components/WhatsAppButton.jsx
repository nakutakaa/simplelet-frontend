// src/components/WhatsAppButton.jsx
import React from "react";
import toast from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import API from "../services/api";

// Fetch WhatsApp link
const fetchWhatsAppLink = async (listingId) => {
  const { data } = await API.get(`/listings/${listingId}/whatsapp-link`);
  return data;
};

const WhatsAppButton = ({
  listingId,
  userPhone,
  listingTitle,
  listingPrice,
  size = "md",
}) => {
  // Size classes
  const sizeClasses = {
    sm: {
      button: "px-3 py-1.5 text-sm",
      icon: "w-4 h-4",
      text: "text-sm",
    },
    md: {
      button: "px-4 py-2 text-base",
      icon: "w-5 h-5",
      text: "text-base",
    },
    lg: {
      button: "px-6 py-3 text-lg",
      icon: "w-6 h-6",
      text: "text-lg",
    },
  };

  const sizes = sizeClasses[size] || sizeClasses.md;

  // Fetch WhatsApp link
  const { data, isLoading, error } = useQuery({
    queryKey: ["whatsapp-link", listingId],
    queryFn: () => fetchWhatsAppLink(listingId),
    enabled: !!listingId,
    retry: 1,
  });

  const handleWhatsAppClick = () => {
    const link = data?.whatsapp_link;

    if (!link) {
      toast.error("WhatsApp link not available");
      return;
    }

    // Open WhatsApp
    window.open(link, "_blank");

    // Track click (optional)
    if (data?.lead_tracked) {
      console.log("✅ WhatsApp lead tracked");
    }
  };

  // Generate fallback WhatsApp link if API fails
  const generateFallbackLink = () => {
    if (!userPhone) return null;

    const cleanPhone = userPhone
      .replace("+", "")
      .replace(" ", "")
      .replace("-", "");
    const message = `Hi! I'm interested in your listing: ${listingTitle || "Property"}${listingPrice ? ` - KES ${listingPrice.toLocaleString()}` : ""}. Is it still available for viewing?`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const whatsappLink = data?.whatsapp_link || generateFallbackLink();
  const isDisabled = isLoading || !whatsappLink || error;

  return (
    <button
      onClick={handleWhatsAppClick}
      disabled={isDisabled}
      className={`w-full flex items-center justify-center gap-2 rounded-xl font-medium transition bg-[#25D366] hover:bg-[#1da851] text-white ${sizes.button} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <svg
        className={sizes.icon}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
      <span className={sizes.text}>
        {isLoading ? "Loading..." : "Chat on WhatsApp"}
      </span>
    </button>
  );
};

export default WhatsAppButton;
