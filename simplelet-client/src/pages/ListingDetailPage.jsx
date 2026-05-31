// src/pages/ListingDetailPage.jsx
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import API from "../services/api";
import toast from "react-hot-toast";

const fetchListing = async (id) => {
  const { data } = await API.get(`/listings/${id}`);
  return data;
};

export default function ListingDetailPage() {
  const { id } = useParams();

  const {
    data: listing,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => fetchListing(id),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    toast.error("Failed to load listing");
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Listing not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-2">{listing.title}</h1>
          <p className="text-gray-500 mb-4">{listing.location}</p>
          <p className="text-3xl font-bold text-primary-600 mb-4">
            KSh {listing.price?.toLocaleString()}
          </p>
          <p className="text-gray-700 mb-6">{listing.description}</p>
          <div className="border-t pt-4">
            <p className="text-sm text-gray-500">
              Posted by: {listing.author?.name}
            </p>
            <p className="text-sm text-gray-500">
              Contact: {listing.contact_phone}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
