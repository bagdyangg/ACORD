import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Settings, LogOut, Shield } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Navigation() {
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <TooltipProvider>
      <nav className="bg-gradient-to-r from-purple-50 to-blue-50 shadow-sm border-b border-purple-200 sticky top-0 z-50">
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
                <span className="text-sm font-medium text-gray-700">
                  {user?.firstName} {user?.lastName}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full cursor-help">
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
                      <Button variant="outline" size="sm">
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
    </TooltipProvider>
  );
}