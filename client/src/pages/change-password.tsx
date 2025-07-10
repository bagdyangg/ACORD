import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import ChangePasswordForm from "@/components/change-password-form";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calendar, Clock } from "lucide-react";

interface PasswordStatus {
  mustChangePassword: boolean;
  isExpired: boolean;
  daysUntilExpiry: number;
  passwordExpiryDays: number;
}

export default function ChangePasswordPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: passwordStatus, isLoading } = useQuery<PasswordStatus>({
    queryKey: ["/api/auth/password-status"],
    enabled: !!user,
  });

  const handlePasswordChangeSuccess = () => {
    // Redirect to dashboard after successful password change
    setLocation("/");
  };

  // Show expiry warning if password expires within 7 days
  const showExpiryWarning = passwordStatus && !passwordStatus.isExpired && passwordStatus.daysUntilExpiry <= 7;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-md">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* Password status information */}
        {passwordStatus && (
          <div className="mb-6 space-y-3">
            {passwordStatus.mustChangePassword && (
              <Card className="border-red-500 bg-red-50 dark:bg-red-950">
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <p className="text-red-700 dark:text-red-300 font-medium">
                      Password change required by administrator
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {passwordStatus.isExpired && (
              <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    <p className="text-orange-700 dark:text-orange-300 font-medium">
                      Your password has expired
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {showExpiryWarning && (
              <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-yellow-500" />
                    <p className="text-yellow-700 dark:text-yellow-300 font-medium">
                      Password expires in {passwordStatus.daysUntilExpiry} day{passwordStatus.daysUntilExpiry !== 1 ? 's' : ''}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {!passwordStatus.mustChangePassword && !passwordStatus.isExpired && !showExpiryWarning && (
              <Card className="border-green-500 bg-green-50 dark:bg-green-950">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="border-green-500 text-green-700">
                        Password Active
                      </Badge>
                    </div>
                    <p className="text-green-700 dark:text-green-300 text-sm">
                      {passwordStatus.daysUntilExpiry} days remaining
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Change password form */}
        <ChangePasswordForm
          onSuccess={handlePasswordChangeSuccess}
          mustChangePassword={passwordStatus?.mustChangePassword || passwordStatus?.isExpired}
        />

        {/* Additional information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Password Policy</CardTitle>
            <CardDescription className="text-xs">
              Current requirements for ACORD system passwords
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Minimum 8 characters</li>
              <li>• Must contain letters and numbers</li>
              <li>• Password expires every {passwordStatus?.passwordExpiryDays || 120} days</li>
              <li>• Cannot reuse previous passwords</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}