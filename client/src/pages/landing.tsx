import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-neutral flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-primary mb-2">LunchOrder</h1>
            <p className="text-gray-600">Sign in to place your lunch order</p>
          </div>
          
          <div className="space-y-4">
            <Button 
              onClick={handleLogin}
              className="w-full bg-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
            >
              Sign In with Replit
            </Button>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Use your Replit account to access the lunch ordering system
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
