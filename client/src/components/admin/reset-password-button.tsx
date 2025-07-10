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
      const response = await fetch(`/api/admin/reset-password/${user.id}`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to reset password");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Password Reset Successful",
        description: `New temporary password for ${user.firstName} ${user.lastName}: ${data.tempPassword}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsResetting(false);
    },
    onError: (error: Error) => {
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