import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { useState, useEffect } from "react";

function MinimalApp() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    setMessage("ACORD Password Management System - Ready");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">ACORD</h1>
        <p className="text-gray-600">{message}</p>
        <div className="mt-8">
          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MinimalApp />
    </QueryClientProvider>
  );
}

export default App;