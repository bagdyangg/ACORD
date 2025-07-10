import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { usePasswordAuth } from "@/hooks/use-password-auth";
import { useEffect, useState } from "react";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Admin from "@/pages/admin";
import ChangePassword from "@/pages/change-password";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user, error } = useAuth();
  const { requiresPasswordChange, isLoading: passwordLoading } = usePasswordAuth();
  const [forceRender, setForceRender] = useState(0);

  console.log("Router state:", { isAuthenticated, isLoading, user, error });

  // Force re-render when authentication state changes
  useEffect(() => {
    if (!isLoading) {
      setForceRender(prev => prev + 1);
    }
  }, [isAuthenticated, isLoading]);

  // Extended loading time to ensure proper state resolution
  if (isLoading || passwordLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Add debugging for deployment
  if (error) {
    console.error("Authentication error:", error);
  }

  // Clear render key to force component refresh
  const renderKey = `${isAuthenticated ? 'auth' : 'noauth'}-${forceRender}`;

  // If there's an authentication error and we're not loading, show login
  if (!isLoading && !isAuthenticated) {
    return (
      <div key={renderKey}>
        <Switch>
          <Route path="/" component={Login} />
          <Route component={Login} />
        </Switch>
      </div>
    );
  }

  // If authenticated, check password status and show appropriate routes
  if (!isLoading && !passwordLoading && isAuthenticated) {
    // Force password change if required
    if (requiresPasswordChange) {
      return (
        <div key={renderKey}>
          <Switch>
            <Route path="/change-password" component={ChangePassword} />
            <Route component={() => <ChangePassword />} />
          </Switch>
        </div>
      );
    }

    return (
      <div key={renderKey}>
        <Switch>
          <Route path="/" component={() => {
            // Redirect superadmin directly to admin panel
            if (user?.role === "superadmin") {
              return <Admin />;
            }
            return <Dashboard />;
          }} />
          <Route path="/admin" component={Admin} />
          <Route path="/change-password" component={ChangePassword} />
          <Route component={NotFound} />
        </Switch>
      </div>
    );
  }

  // Fallback for any other state
  return (
    <div key="fallback">
      <Switch>
        <Route path="/" component={Login} />
        <Route component={Login} />
      </Switch>
    </div>
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
