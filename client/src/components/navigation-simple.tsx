import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Settings, LogOut, Shield, Key } from "lucide-react";
import { useState } from "react";
import ChangePasswordModal from "./change-password-modal";
import ThemeToggle from "@/components/theme-toggle";

export default function Navigation() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        window.location.href = "/";
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/";
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="/generated-icon.png" 
                alt="ACORD Logo" 
                className="w-10 h-10 object-contain rounded-lg cursor-pointer"
              />
              <Link href="/">
                <h1 className="text-2xl font-bold text-primary cursor-pointer">ACORD</h1>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {user?.profileImageUrl && (
                  <img 
                    src={user.profileImageUrl} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full object-cover cursor-pointer"
                  />
                )}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                  {user?.role}
                </span>
              </div>

              {(user?.role === "admin" || user?.role === "superadmin") && (
                <Link href="/admin">
                  <Button 
                    variant={location === "/admin" ? "default" : "outline"} 
                    size="sm"
                    className={location === "/admin" ? "bg-primary text-primary-foreground" : ""}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                </Link>
              )}

              <Button variant="ghost" size="sm" onClick={() => setShowPasswordModal(true)}>
                <Key className="h-4 w-4" />
              </Button>

              <ThemeToggle />

              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <ChangePasswordModal
        open={showPasswordModal}
        onOpenChange={setShowPasswordModal}
      />
    </>
  );
}