import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, UserX } from "lucide-react";

interface ActivationButtonProps {
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    role: string;
  };
  currentUserId: string;
}

export default function ActivationButton({ user, currentUserId }: ActivationButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const activationMutation = useMutation({
    mutationFn: async (action: 'activate' | 'deactivate') => {
      const response = await fetch(`/api/admin/users/${user.id}/${action}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${action} user`);
      }

      return response.json();
    },
    onSuccess: (data, action) => {
      const actionText = action === 'activate' ? 'activated' : 'deactivated';
      toast({
        title: "Success",
        description: `User ${user.firstName} ${user.lastName} has been ${actionText}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsProcessing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const handleActivation = (action: 'activate' | 'deactivate') => {
    const actionText = action === 'activate' ? 'activate' : 'deactivate';
    const confirmMessage = `Are you sure you want to ${actionText} ${user.firstName} ${user.lastName}?`;
    
    if (window.confirm(confirmMessage)) {
      setIsProcessing(true);
      activationMutation.mutate(action);
    }
  };

  // Don't show activation controls for yourself or superadmin users
  if (user.id === currentUserId || user.role === 'superadmin') {
    return null;
  }

  return (
    <div className="flex gap-1">
      {user.isActive ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleActivation('deactivate')}
          disabled={isProcessing || activationMutation.isPending}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <UserX className="h-3 w-3 mr-1" />
          Deactivate
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleActivation('activate')}
          disabled={isProcessing || activationMutation.isPending}
          className="text-green-600 hover:text-green-700 hover:bg-green-50"
        >
          <UserCheck className="h-3 w-3 mr-1" />
          Activate
        </Button>
      )}
    </div>
  );
}