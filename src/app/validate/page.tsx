"use client";

import { formatDate } from "@/lib/helpers";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface ValidationResult {
  success: boolean;
  data?: {
    campaign_name: string;
    amount: number;
    validated_at: string;
  };
  error?: string;
}

export default function ValidateCode() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ unique_code: code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to validate code");
      }

      setResult({
        success: true,
        ...data,
      });
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <button
        onClick={() => {
          router.push("/"); // Redirect to campaigns list
          router.refresh();
        }}
        className="text-blue-600 hover:text-blue-900 mb-4"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6 inline-block"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
        Back
      </button>
      <h1 className="text-2xl font-bold mb-6">Validate Code</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="code"
            className="block text-sm font-medium text-gray-700"
          >
            Enter Code
          </label>
          <input
            type="text"
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
            required
            pattern="\d{12}"
            title="Please enter a 12-digit code"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 
            ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {loading ? "Validating..." : "Validate Code"}
        </button>
      </form>

      {result && (
        <div
          className={`mt-4 p-4 rounded-md ${
            result.success
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          {result.success ? (
            <div>
              <h3 className="text-green-800 font-medium">Code Validated!</h3>
              <p className="text-sm text-green-700 mt-1">
                Campaign: {result.data?.campaign_name}
                <br />
                Amount: ${result.data?.amount.toLocaleString()}
                <br />
                Validated at: {formatDate(result.data!.validated_at)}
              </p>
            </div>
          ) : (
            <div className="text-red-800">{result.error}</div>
          )}
        </div>
      )}
    </div>
  );
}
