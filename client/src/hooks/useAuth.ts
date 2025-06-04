import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import type { User } from "@shared/schema";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
}

export function useAuth(): AuthState {
  const [hasInitialized, setHasInitialized] = useState(false);
  
  const { data: user, isLoading, error, isSuccess } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: (failureCount, error) => {
      // Only retry if it's not a 401 (unauthorized)
      return failureCount < 2 && error.message !== "401";
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes  
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/user", {
          credentials: "include",
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (response.status === 401) {
          return null; // User not authenticated
        }
        
        if (!response.ok) {
          console.error("Auth fetch failed:", response.status, response.statusText);
          throw new Error(response.status.toString());
        }
        
        const userData = await response.json();
        console.log("Auth user data:", userData);
        return userData;
      } catch (error) {
        console.error("Auth query error:", error);
        if (error instanceof Error && error.message === "401") {
          return null;
        }
        throw error;
      }
    },
  });

  // Mark as initialized after first successful query
  useEffect(() => {
    if ((isSuccess || error) && !hasInitialized) {
      setHasInitialized(true);
    }
  }, [isSuccess, error, hasInitialized]);

  return {
    user: user ?? null,
    isLoading: isLoading || !hasInitialized,
    isAuthenticated: !!user && hasInitialized,
    error: error ?? null,
  };
}