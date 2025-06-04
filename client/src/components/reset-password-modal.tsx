import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordType } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

interface ResetPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess: () => void;
}

export default function ResetPasswordModal({ open, onOpenChange, user, onSuccess }: ResetPasswordModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const form = useForm<ResetPasswordType>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      userId: user?.id || "",
      tempPassword: ""
    }
  });

  // Update form when user changes
  useEffect(() => {
    if (user) {
      form.setValue("userId", user.id);
    }
  }, [user, form]);

  const generateSecurePassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}";
    
    let password = "";
    // Ensure at least one character from each required type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly to reach 16 characters
    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = 4; i < 16; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleGeneratePassword = () => {
    const newPassword = generateSecurePassword();
    form.setValue("tempPassword", newPassword);
  };

  const onSubmit = async (data: ResetPasswordType) => {
    setIsSubmitting(true);
    setError("");

    try {
      await apiRequest("/api/admin/password/reset", {
        method: "POST",
        body: JSON.stringify(data)
      });

      toast({
        title: "Password Reset",
        description: `Password has been reset for ${user?.firstName} ${user?.lastName}. User must change password on next login.`,
      });
      
      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setError("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Reset password for {user?.firstName} {user?.lastName} ({user?.username})
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This will force the user to change their password on next login.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="tempPassword">Temporary Password</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="tempPassword"
                  type={showPassword ? "text" : "password"}
                  {...form.register("tempPassword")}
                  className="pr-10"
                  placeholder="Enter temporary password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleGeneratePassword}
                className="whitespace-nowrap"
              >
                Generate
              </Button>
            </div>
            {form.formState.errors.tempPassword && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {form.formState.errors.tempPassword.message}
              </p>
            )}
            <div className="text-xs text-gray-600 dark:text-gray-400">
              12+ characters with 3 types: lowercase, uppercase, numbers, symbols
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="destructive"
              className="flex-1" 
              disabled={isSubmitting || !form.watch("tempPassword")}
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}