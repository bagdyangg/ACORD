import React, { useEffect, useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/useAuth";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user, error } = useAuth();

  console.log("Router state:", { isAuthenticated, isLoading, user, error });

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Login} />
        <Route component={Login} />
      </Switch>
    );
  }

  // Show protected routes if authenticated
  return (
    <Switch>
      <Route path="/" component={() => {
        if (user?.role === "superadmin") {
          return <Admin />;
        }
        return <Dashboard />;
      }} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    // Initialize theme from localStorage on app startup
    const initializeTheme = () => {
      // Check if there's any saved theme for any user
      const allKeys = Object.keys(localStorage);
      const themeKeys = allKeys.filter(key => key.startsWith('theme_'));
      
      if (themeKeys.length > 0) {
        // Use the most recent theme setting
        const latestThemeKey = themeKeys[themeKeys.length - 1];
        const savedTheme = localStorage.getItem(latestThemeKey);
        
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
          document.body.classList.add('dark');
          document.body.style.backgroundColor = '#1f2937';
          document.body.style.color = '#f3f4f6';
        }
      }
    };

    initializeTheme();

    // Ensure app is fully loaded before rendering
    const timer = setTimeout(() => {
      setIsAppReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (!isAppReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
