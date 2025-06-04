import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import ChangePasswordModal from "./change-password-modal";

export default function PasswordExpiryBanner() {
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const { data: expiry } = useQuery({
    queryKey: ["/api/password/expiry"],
    refetchInterval: 24 * 60 * 60 * 1000, // Check once per day
  });

  // Reset dismissed state when expiry changes
  useEffect(() => {
    if (expiry?.daysUntilExpiry !== undefined) {
      setDismissed(false);
    }
  }, [expiry?.daysUntilExpiry]);

  if (!expiry || dismissed) return null;

  // Show warning if password expires in 14 days or less
  const daysUntilExpiry = expiry.daysUntilExpiry ?? 999;
  const isExpired = expiry.isExpired ?? false;
  const shouldShowWarning = daysUntilExpiry <= 14 || isExpired;
  
  if (!shouldShowWarning) return null;

  const isUrgent = daysUntilExpiry <= 3 || isExpired;

  return (
    <>
      <Alert variant={isUrgent ? "destructive" : "default"} className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            {isExpired ? (
              <span className="font-medium">Your password has expired and must be changed.</span>
            ) : (
              <span>
                Your password expires in <span className="font-medium">{daysUntilExpiry} days</span>. 
                Change it now to avoid service interruption.
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button
              size="sm"
              variant={isUrgent ? "secondary" : "outline"}
              onClick={() => setShowModal(true)}
            >
              Change Password
            </Button>
            {!isExpired && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDismissed(true)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>

      <ChangePasswordModal 
        open={showModal} 
        onOpenChange={setShowModal}
      />
    </>
  );
}