import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface PasswordStatus {
  mustChangePassword: boolean;
  isExpired: boolean;
  daysUntilExpiry: number;
  passwordExpiryDays: number;
}

export function usePasswordAuth() {
  const [, setLocation] = useLocation();
  
  const { data: passwordStatus, isLoading } = useQuery<PasswordStatus>({
    queryKey: ["/api/auth/password-status"],
    enabled: true,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always check password status
  });

  useEffect(() => {
    // Redirect to change password page if required
    if (passwordStatus && (passwordStatus.mustChangePassword || passwordStatus.isExpired)) {
      const currentPath = window.location.pathname;
      if (currentPath !== "/change-password") {
        setLocation("/change-password");
      }
    }
  }, [passwordStatus, setLocation]);

  return {
    passwordStatus,
    isLoading,
    requiresPasswordChange: passwordStatus?.mustChangePassword || passwordStatus?.isExpired || false,
  };
}