import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Link } from "wouter";

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("orders");
  
  const today = new Date().toISOString().split('T')[0];

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-neutral">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
                <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
                <Link href="/">
                  <Button>Back to Dashboard</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Fetch orders summary
  const { data: ordersSummary } = useQuery({
    queryKey: ["/api/admin/orders", { date: today }],
  });

  // Fetch users
  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  // Upload dish mutation
  const uploadDishMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/dishes", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Dish uploaded successfully!",
        description: "The new dish has been added to today's menu.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dishes"] });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDishUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    uploadDishMutation.mutate(formData);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="min-h-screen bg-neutral">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-secondary">Admin Dashboard</h1>
            <p className="text-gray-600">Manage orders, menu, and users</p>
          </div>
          <Link href="/">
            <Button variant="outline">
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orders">Orders Summary</TabsTrigger>
            <TabsTrigger value="upload">Upload Menu</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            {ordersSummary && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-blue-900">Today's Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Orders:</span>
                        <span className="font-bold">{ordersSummary.totalOrders}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Revenue:</span>
                        <span className="font-bold">${ordersSummary.totalRevenue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Most Popular:</span>
                        <span className="font-bold">{ordersSummary.mostPopular || "N/A"}</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-green-900">Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {Object.entries(ordersSummary.dishCounts || {}).map(([dish, count]) => (
                        <div key={dish} className="flex justify-between">
                          <span>{dish}:</span>
                          <span className="font-bold">{count}x</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Individual Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {ordersSummary.orders?.map((order: any, index: number) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {order.userName} {order.userLastName}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">{order.dishName}</td>
                              <td className="px-6 py-4 text-sm text-gray-900">${parseFloat(order.totalPrice).toFixed(2)}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {new Date(order.createdAt).toLocaleTimeString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex space-x-4">
                  <Button className="bg-accent text-white hover:bg-teal-600">
                    Send to Restaurant
                  </Button>
                  <Button variant="outline">
                    Export Report
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="upload">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Upload New Dish</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDishUpload} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Dish Name</Label>
                    <Input id="name" name="name" required />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" />
                  </div>
                  
                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Input id="price" name="price" type="number" step="0.01" min="0" required />
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select name="category">
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Healthy">Healthy</SelectItem>
                        <SelectItem value="Popular">Popular</SelectItem>
                        <SelectItem value="Vegan">Vegan</SelectItem>
                        <SelectItem value="Comfort">Comfort</SelectItem>
                        <SelectItem value="Premium">Premium</SelectItem>
                        <SelectItem value="Classic">Classic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="image">Image</Label>
                    <Input id="image" name="image" type="file" accept="image/*" required />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={uploadDishMutation.isPending}
                  >
                    {uploadDishMutation.isPending ? "Uploading..." : "Upload Dish"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Registered Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((user: any) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
