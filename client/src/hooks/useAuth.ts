import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache (replaces cacheTime in v5)
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gets focus
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/user", {
          credentials: "include",
        });
        
        if (response.status === 401) {
          return null; // User not authenticated
        }
        
        if (!response.ok) {
          console.error("Auth fetch failed:", response.status, response.statusText);
          throw new Error(`HTTP ${response.status}`);
        }
        
        const userData = await response.json();
        console.log("Auth user data:", userData);
        return userData;
      } catch (error) {
        console.error("Auth query error:", error);
        return null;
      }
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}