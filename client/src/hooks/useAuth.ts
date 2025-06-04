import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/user", {
          credentials: "include",
        });
        
        if (response.status === 401) {
          return null;
        }
        
        if (!response.ok) {
          return null;
        }
        
        return response.json();
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 300000,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}