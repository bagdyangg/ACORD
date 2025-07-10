import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Settings, LogOut, Shield, Lock, FileText } from "lucide-react";
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
      <nav className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 shadow-sm border-b border-purple-200 dark:border-gray-700 sticky top-0 z-50 safe-area-inset-top">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/" className="flex items-center space-x-2">
                    <img 
                      src="/logo.jpeg" 
                      alt="ACORD Logo" 
                      className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-lg cursor-pointer"
                    />
                    <h1 className="hidden sm:block text-xl sm:text-2xl font-bold text-primary cursor-pointer">ACORD</h1>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>ACORD Lunch Ordering System - Go to dashboard</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-shrink">
                {user?.profileImageUrl && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <img 
                        src={user.profileImageUrl} 
                        alt="Profile" 
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover cursor-pointer flex-shrink-0"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Your profile picture</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 min-w-0">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 truncate max-w-[80px] sm:max-w-none">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1 py-0.5 sm:px-2 sm:py-1 rounded-full cursor-help">
                        {user?.role}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Your role: {user?.role === 'admin' ? 'Administrator' : user?.role === 'superadmin' ? 'Super Administrator' : 'Employee'}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
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
                        <Shield className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Admin</span>
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
                  <Link href="/releases">
                    <Button 
                      variant={location === "/releases" ? "default" : "ghost"} 
                      size="sm"
                      className={location === "/releases" ? "bg-primary text-primary-foreground" : ""}
                    >
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View release notes and changelog</p>
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
                  <Link href="/change-password">
                    <Button variant="ghost" size="sm">
                      <Lock className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Change password</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
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
    </TooltipProvider>
  );
}