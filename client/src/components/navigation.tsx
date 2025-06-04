import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Settings, LogOut, Shield, Key } from "lucide-react";
import { useState } from "react";
import ChangePasswordModal from "./change-password-modal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
      // Force redirect even if logout fails
      window.location.href = "/";
    }
  };

  return (
    <TooltipProvider>
      <nav className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 shadow-sm border-b border-purple-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <img 
                    src="/logo.jpeg" 
                    alt="ACORD Logo" 
                    className="w-10 h-10 object-contain rounded-lg cursor-pointer"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>ACORD Lunch Ordering System</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/">
                    <h1 className="text-2xl font-bold text-primary cursor-pointer">ACORD</h1>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Go to dashboard</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {user?.profileImageUrl && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <img 
                        src={user.profileImageUrl} 
                        alt="Profile" 
                        className="w-8 h-8 rounded-full object-cover cursor-pointer"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Your profile picture</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {user?.firstName} {user?.lastName}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full cursor-help">
                      {user?.role}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Your role: {user?.role === 'admin' ? 'Administrator' : user?.role === 'superadmin' ? 'Super Administrator' : 'Employee'}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {(user?.role === "admin" || user?.role === "superadmin") && (
                <Tooltip>
                  <TooltipTrigger asChild>
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
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Access admin panel to manage users and dishes</p>
                  </TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => setShowPasswordModal(true)}>
                    <Key className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Change password</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <ThemeToggle />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle dark/light theme</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sign out of your account</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </nav>
      
      <ChangePasswordModal 
        open={showPasswordModal} 
        onOpenChange={setShowPasswordModal}
      />
    </TooltipProvider>
  );
}