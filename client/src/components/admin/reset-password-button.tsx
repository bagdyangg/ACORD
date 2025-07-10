import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Shield } from "lucide-react";

interface ResetPasswordButtonProps {
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
}

export default function ResetPasswordButton({ user }: ResetPasswordButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isResetting, setIsResetting] = useState(false);

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      console.log("Resetting password for user:", user.id);
      const response = await fetch(`/api/admin/reset-password/${user.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({}), // Send empty JSON object since we only need the userId from URL params
      });

      console.log("Reset password response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log("Reset password error response:", errorText);
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { message: `HTTP ${response.status}: ${errorText}` };
        }
        throw new Error(error.message || "Failed to reset password");
      }

      const data = await response.json();
      console.log("Reset password success data:", data);
      return data;
    },
    onSuccess: (data) => {
      console.log("Password reset successful:", data);
      
      // Copy password to clipboard
      if (navigator.clipboard) {
        navigator.clipboard.writeText(data.tempPassword).then(() => {
          toast({
            title: "Password Reset Successful",
            description: `Temporary password for ${user.firstName} ${user.lastName}: ${data.tempPassword} (copied to clipboard)`,
            duration: 8000,
          });
        }).catch(() => {
          toast({
            title: "Password Reset Successful", 
            description: `Temporary password for ${user.firstName} ${user.lastName}: ${data.tempPassword} (please copy manually)`,
            duration: 8000,
          });
        });
      } else {
        toast({
          title: "Password Reset Successful",
          description: `Temporary password for ${user.firstName} ${user.lastName}: ${data.tempPassword} (please copy manually)`,
          duration: 8000,
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsResetting(false);
    },
    onError: (error: Error) => {
      console.error("Password reset error:", error);
      toast({
        title: "Reset Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsResetting(false);
    },
  });

  const handleResetPassword = () => {
    if (window.confirm(`Reset password for ${user.firstName} ${user.lastName}? They will need to change it on next login.`)) {
      setIsResetting(true);
      resetPasswordMutation.mutate();
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleResetPassword}
      disabled={isResetting || resetPasswordMutation.isPending}
      className="text-orange-600 border-orange-200 hover:bg-orange-50"
    >
      <Shield className="h-4 w-4 mr-1" />
      {isResetting || resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
    </Button>
  );
}