import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordInput } from "@shared/password-utils";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import { RotateCcw, Settings, Shield, Clock, AlertTriangle } from "lucide-react";

interface PasswordManagementProps {
  user: User;
}

export default function PasswordManagement({ user }: PasswordManagementProps) {
  const [open, setOpen] = useState(false);
  const [expiryOpen, setExpiryOpen] = useState(false);
  const [expiryDays, setExpiryDays] = useState(user.passwordExpiryDays || 120);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      userId: user.id,
      temporaryPassword: "",
      mustChangePassword: true,
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordInput) => {
      const response = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to reset password");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password reset successfully",
      });
      form.reset();
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateExpiryMutation = useMutation({
    mutationFn: async (days: number) => {
      const response = await fetch(`/api/admin/password-expiry/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update expiry");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password expiry updated successfully",
      });
      setExpiryOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ResetPasswordInput) => {
    resetPasswordMutation.mutate(data);
  };

  const handleExpiryUpdate = () => {
    updateExpiryMutation.mutate(expiryDays);
  };

  const getPasswordStatusBadge = () => {
    if (user.mustChangePassword) {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Must Change</Badge>;
    }
    
    // Calculate days until expiry
    const passwordAge = Math.floor((Date.now() - new Date(user.passwordChangedAt).getTime()) / (1000 * 60 * 60 * 24));
    const daysUntilExpiry = user.passwordExpiryDays - passwordAge;
    
    if (daysUntilExpiry <= 0) {
      return <Badge variant="destructive"><Clock className="h-3 w-3 mr-1" />Expired</Badge>;
    } else if (daysUntilExpiry <= 7) {
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Expires Soon ({daysUntilExpiry}d)</Badge>;
    } else {
      return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Active ({daysUntilExpiry}d)</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Password Management</span>
        </CardTitle>
        <CardDescription>
          Reset user password and manage expiry settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{user.firstName} {user.lastName}</p>
            <p className="text-sm text-gray-500">@{user.username}</p>
          </div>
          {getPasswordStatusBadge()}
        </div>

        <div className="flex space-x-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Password
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>
                  Set a new temporary password for {user.firstName} {user.lastName}. 
                  The user will be required to change it on next login.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="temporaryPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temporary Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Enter temporary password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mustChangePassword"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                        <FormLabel>Require password change on next login</FormLabel>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={resetPasswordMutation.isPending}>
                      {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {user.role !== "superadmin" && (
            <Dialog open={expiryOpen} onOpenChange={setExpiryOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Expiry Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Password Expiry Settings</DialogTitle>
                  <DialogDescription>
                    Set the number of days before the password expires for {user.firstName} {user.lastName}.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="expiry-days">Expiry Days (1-365)</Label>
                    <Input
                      id="expiry-days"
                      type="number"
                      min="1"
                      max="365"
                      value={expiryDays}
                      onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setExpiryOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleExpiryUpdate}
                      disabled={updateExpiryMutation.isPending || expiryDays < 1 || expiryDays > 365}
                    >
                      {updateExpiryMutation.isPending ? "Updating..." : "Update Expiry"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}