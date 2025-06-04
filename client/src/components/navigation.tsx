import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Settings, LogOut, Shield } from "lucide-react";
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
      window.location.href = "/";
    }
  };

  return (
    <nav className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 shadow-sm border-b border-purple-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <img 
              src="/logo.jpeg" 
              alt="ACORD Logo" 
              className="w-10 h-10 object-contain rounded-lg cursor-pointer"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">ACORD</h1>
              <p className="text-xs text-gray-600 dark:text-gray-300">Lunch Ordering System</p>
            </div>
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

            <div className="flex items-center space-x-2">
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

              <ThemeToggle />

              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}