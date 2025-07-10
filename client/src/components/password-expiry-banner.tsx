import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { AlertTriangle, Clock, X } from "lucide-react";

interface PasswordStatus {
  mustChangePassword: boolean;
  isExpired: boolean;
  daysUntilExpiry: number;
  passwordExpiryDays: number;
}

export default function PasswordExpiryBanner() {
  const [dismissed, setDismissed] = useState(false);
  
  const { data: passwordStatus } = useQuery<PasswordStatus>({
    queryKey: ["/api/auth/password-status"],
  });

  // Don't show banner if dismissed or no password status
  if (dismissed || !passwordStatus) {
    return null;
  }

  // Show banner for critical cases
  const showBanner = passwordStatus.mustChangePassword || 
                     passwordStatus.isExpired || 
                     (!passwordStatus.isExpired && passwordStatus.daysUntilExpiry <= 7);

  if (!showBanner) {
    return null;
  }

  // Determine banner style and message
  let variant: "default" | "destructive" = "default";
  let message = "";
  let icon = <Clock className="h-4 w-4" />;

  if (passwordStatus.mustChangePassword) {
    variant = "destructive";
    message = "Password change required by administrator";
    icon = <AlertTriangle className="h-4 w-4" />;
  } else if (passwordStatus.isExpired) {
    variant = "destructive";
    message = "Your password has expired";
    icon = <AlertTriangle className="h-4 w-4" />;
  } else if (passwordStatus.daysUntilExpiry <= 7) {
    message = `Password expires in ${passwordStatus.daysUntilExpiry} day${passwordStatus.daysUntilExpiry !== 1 ? 's' : ''}`;
  }

  return (
    <Alert variant={variant} className="mb-4">
      {icon}
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        <div className="flex items-center space-x-2">
          <Link href="/change-password">
            <Button variant="outline" size="sm">
              Change Password
            </Button>
          </Link>
          {!passwordStatus.mustChangePassword && !passwordStatus.isExpired && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(true)}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}