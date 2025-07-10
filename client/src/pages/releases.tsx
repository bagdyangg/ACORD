import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, AlertCircle, Info, Zap, Shield, Users, Clock } from "lucide-react";
import { Link } from "wouter";
import Navigation from "@/components/navigation";

interface Release {
  version: string;
  date: string;
  type: "major" | "minor" | "patch";
  status: "stable" | "beta" | "deprecated";
  title: string;
  description: string;
  features: Array<{
    type: "feature" | "improvement" | "fix" | "security";
    title: string;
    description: string;
  }>;
}

const releases: Release[] = [
  {
    version: "v1.3.0",
    date: "2025-07-10",
    type: "minor",
    status: "stable",
    title: "Enhanced Image Management System with Integrity Validation",
    description: "Advanced image integrity validation and broken image prevention system with automatic file cleanup.",
    features: [
      {
        type: "feature",
        title: "Automatic Image File Validation",
        description: "Real-time validation of image files in dish API endpoints to prevent broken image display"
      },
      {
        type: "improvement",
        title: "Intelligent Image Filtering",
        description: "Smart filtering system that automatically excludes dishes with missing image files"
      },
      {
        type: "improvement",
        title: "Enhanced Data Cleanup",
        description: "Improved clearTodayData function with proper file cleanup and orphaned record management"
      },
      {
        type: "feature",
        title: "Image Integrity Monitoring",
        description: "Detailed logging system for tracking and identifying missing image files"
      },
      {
        type: "fix",
        title: "Broken Image Resolution",
        description: "Fixed critical issue with orphaned dish records showing broken image placeholders"
      },
      {
        type: "improvement",
        title: "File Path Handling",
        description: "Enhanced support for multiple upload formats and improved file system consistency"
      }
    ]
  },
  {
    version: "v1.2.3",
    date: "2025-07-10",
    type: "minor",
    status: "stable",
    title: "Last Login Tracking, Admin Access & Cache Resolution System",
    description: "Added comprehensive user activity tracking, confirmed admin access to password policies, and implemented automatic cache management to eliminate manual refresh issues.",
    features: [
      {
        type: "feature",
        title: "Last Login Tracking",
        description: "Automatic recording of user login timestamps with relative time display (2h ago, 3d ago)"
      },
      {
        type: "feature",
        title: "Enhanced User Management Table",
        description: "New 'Last Login' column showing when users last accessed the system"
      },
      {
        type: "improvement",
        title: "User Activity Insights",
        description: "Administrators can now monitor user engagement and system usage patterns"
      },
      {
        type: "security",
        title: "Admin Password Policy Access",
        description: "Confirmed admin users have full access to Password Policy settings alongside superadmin users"
      },
      {
        type: "fix",
        title: "Automatic Cache Clearing",
        description: "No more Ctrl+Shift+R required - automatic cache invalidation on version updates"
      },
      {
        type: "improvement",
        title: "Zero-Cache API Strategy",
        description: "All API requests now use no-store directive for real-time data accuracy"
      },
      {
        type: "improvement",
        title: "Version Detection System",
        description: "Real-time monitoring for version changes with automatic cache clearing"
      },
      {
        type: "fix",
        title: "Service Worker Optimization",
        description: "Complete service worker lifecycle management with aggressive cache busting"
      }
    ]
  },
  {
    version: "v1.2.2",
    date: "2025-07-10",
    type: "minor",
    status: "stable",
    title: "User Activation/Deactivation System",
    description: "Complete user lifecycle management with activation controls and security protections.",
    features: [
      {
        type: "feature",
        title: "User Activation Controls",
        description: "Administrators can now activate and deactivate user accounts from the User Management interface"
      },
      {
        type: "security",
        title: "Enhanced Authentication",
        description: "Inactive users are automatically blocked from logging into the system"
      },
      {
        type: "feature",
        title: "Activity Status Display",
        description: "New 'Active' status column with visual badges in the user management table"
      },
      {
        type: "security",
        title: "Self-Protection Mechanisms",
        description: "Built-in protections prevent users from deactivating themselves or superadmin accounts"
      }
    ]
  },
  {
    version: "v1.2.1",
    date: "2025-07-10",
    type: "patch",
    status: "stable",
    title: "Reset Password Button Integration & Status Management",
    description: "Streamlined password management with integrated controls and configurable warning periods.",
    features: [
      {
        type: "improvement",
        title: "Integrated Password Reset",
        description: "Moved Reset Password functionality directly into User Management table Actions column"
      },
      {
        type: "feature",
        title: "Automatic Password Copying",
        description: "Generated temporary passwords (exactly 8 characters) are automatically copied to clipboard"
      },
      {
        type: "feature",
        title: "Configurable Warning Periods",
        description: "Administrators can set custom expiry warning periods (1, 3, 7, 14, 30 days) in Password Policy settings"
      },
      {
        type: "improvement",
        title: "Streamlined Interface",
        description: "Reduced admin interface from 4 tabs to 3 tabs (Menu, Users, Policy) for better usability"
      },
      {
        type: "feature",
        title: "Enhanced Status Badges",
        description: "Password status badges now use administrator-configured warning periods instead of fixed thresholds"
      }
    ]
  },
  {
    version: "v1.2.0",
    date: "2025-07-08",
    type: "major",
    status: "stable",
    title: "Password Management System",
    description: "Comprehensive password security framework with configurable policies and automated enforcement.",
    features: [
      {
        type: "feature",
        title: "Password Policy Engine",
        description: "Configurable password policies with expiry settings (default 120 days, admin configurable)"
      },
      {
        type: "feature",
        title: "Password Change Interface",
        description: "User-friendly password change system with validation (min 8 chars, letters+numbers)"
      },
      {
        type: "security",
        title: "Forced Password Changes",
        description: "App-level blocking mechanism for users who must change passwords"
      },
      {
        type: "feature",
        title: "Admin Password Reset",
        description: "Administrative password reset functionality with temporary password generation"
      },
      {
        type: "feature",
        title: "Expiry Monitoring",
        description: "Automated password status monitoring with expiry warnings and notifications"
      }
    ]
  },
  {
    version: "v1.1.1",
    date: "2025-07-08",
    type: "patch",
    status: "stable",
    title: "Major Cache Fixing Update",
    description: "Critical performance improvements with enhanced caching strategy and debugging tools.",
    features: [
      {
        type: "fix",
        title: "Cache System Overhaul",
        description: "Fixed critical caching issues preventing first page load with network-first Service Worker strategy"
      },
      {
        type: "improvement",
        title: "Automatic Cache Management",
        description: "Implemented automatic cache versioning and cleanup mechanisms"
      },
      {
        type: "feature",
        title: "Cache Debugging Tools",
        description: "Added cache debugging tools and emergency clear endpoints for troubleshooting"
      },
      {
        type: "improvement",
        title: "Optimized Static Files",
        description: "Enhanced static file serving with proper cache headers for better performance"
      }
    ]
  },
  {
    version: "v1.1.0",
    date: "2025-07-02",
    type: "major",
    status: "stable",
    title: "Initial ACORD Release",
    description: "WhatsApp-integrated lunch ordering system with image-only menu selection and comprehensive order management.",
    features: [
      {
        type: "feature",
        title: "WhatsApp Integration",
        description: "Native WhatsApp workflow optimization for mobile lunch ordering"
      },
      {
        type: "feature",
        title: "Image-Only Menu System",
        description: "Visual dish selection interface optimized for mobile sharing and ordering"
      },
      {
        type: "feature",
        title: "Order Management",
        description: "Real-time order processing with user-specific history tracking"
      },
      {
        type: "feature",
        title: "Administrative Dashboard",
        description: "Comprehensive admin panel with analytics, user management, and CSV export"
      },
      {
        type: "feature",
        title: "PWA Support",
        description: "Progressive Web App functionality for offline access and mobile optimization"
      }
    ]
  }
];

const getFeatureIcon = (type: string) => {
  switch (type) {
    case "feature": return <Zap className="h-4 w-4 text-blue-500" />;
    case "improvement": return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "fix": return <AlertCircle className="h-4 w-4 text-orange-500" />;
    case "security": return <Shield className="h-4 w-4 text-red-500" />;
    default: return <Info className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "stable": return <Badge variant="default">Stable</Badge>;
    case "beta": return <Badge variant="secondary">Beta</Badge>;
    case "deprecated": return <Badge variant="destructive">Deprecated</Badge>;
    default: return <Badge variant="outline">Unknown</Badge>;
  }
};

const getVersionBadge = (type: string) => {
  switch (type) {
    case "major": return <Badge variant="destructive">Major</Badge>;
    case "minor": return <Badge variant="default">Minor</Badge>;
    case "patch": return <Badge variant="secondary">Patch</Badge>;
    default: return <Badge variant="outline">Unknown</Badge>;
  }
};

export default function Releases() {
  return (
    <div className="min-h-screen bg-neutral dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Release Notes</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Complete changelog and version history for ACORD
            </p>
          </div>
          <Link href="/">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        <div className="space-y-8">
          {releases.map((release) => (
            <Card key={release.version} className="overflow-hidden">
              <CardHeader className="border-b bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CardTitle className="text-xl">{release.version}</CardTitle>
                    {getVersionBadge(release.type)}
                    {getStatusBadge(release.status)}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(release.date).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {release.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {release.description}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {release.features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      {getFeatureIcon(feature.type)}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {feature.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Card className="p-6">
            <div className="flex items-center justify-center space-x-2 text-gray-500 dark:text-gray-400">
              <Clock className="h-5 w-5" />
              <span>Latest update: {releases[0].date}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              ACORD is actively maintained and regularly updated with new features and improvements.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}