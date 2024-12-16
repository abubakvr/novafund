"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCampaign() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      targetAmount: Number(formData.get("targetAmount")),
      codeAmount: Number(formData.get("codeAmount")),
      maxCodes: Number(formData.get("maxCodes")),
    };

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create campaign");
      }

      router.push("/"); // Redirect to campaigns list
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Create New Campaign</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Campaign Name
          </label>
          <input
            type="text"
            name="name"
            id="name"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700"
            >
              Start Date
            </label>
            <input
              type="datetime-local"
              name="startDate"
              id="startDate"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
            />
          </div>

          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-gray-700"
            >
              End Date
            </label>
            <input
              type="datetime-local"
              name="endDate"
              id="endDate"
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="targetAmount"
              className="block text-sm font-medium text-gray-700"
            >
              Target Amount
            </label>
            <input
              type="number"
              name="targetAmount"
              id="targetAmount"
              min="1"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
            />
          </div>

          <div>
            <label
              htmlFor="codeAmount"
              className="block text-sm font-medium text-gray-700"
            >
              Amount per Code
            </label>
            <input
              type="number"
              name="codeAmount"
              id="codeAmount"
              min="1"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
            />
          </div>

          <div>
            <label
              htmlFor="maxCodes"
              className="block text-sm font-medium text-gray-700"
            >
              Number of Codes
            </label>
            <input
              type="number"
              name="maxCodes"
              id="maxCodes"
              min="1"
              max="25000"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 
              ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {loading ? "Creating..." : "Create Campaign"}
          </button>
        </div>
      </form>
    </div>
  );
}
