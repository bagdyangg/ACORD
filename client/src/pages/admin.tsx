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
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  
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

  // Fetch dishes
  const { data: dishes = [] } = useQuery({
    queryKey: ["/api/dishes"],
  });

  // Bulk upload mutation
  const bulkUploadMutation = useMutation({
    mutationFn: async (images: File[]) => {
      const results = [];
      setUploadProgress(0);
      
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const formData = new FormData();
        
        // Use filename without extension as dish name
        const dishName = image.name.replace(/\.[^/.]+$/, "");
        formData.append("name", dishName);
        formData.append("description", "");
        formData.append("price", "0");
        formData.append("category", "Popular");
        formData.append("image", image);
        
        try {
          const response = await fetch("/api/dishes", {
            method: "POST",
            body: formData,
            credentials: "include",
          });
          
          if (!response.ok) {
            throw new Error(`Failed to upload ${image.name}`);
          }
          
          const result = await response.json();
          results.push(result);
          setUploadProgress(i + 1);
        } catch (error) {
          console.error(`Error uploading ${image.name}:`, error);
        }
      }
      
      return results;
    },
    onSuccess: (results) => {
      toast({
        title: "Bulk upload completed!",
        description: `Successfully uploaded ${results.length} images.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dishes"] });
      setSelectedImages([]);
      setUploadProgress(0);
    },
    onError: (error) => {
      toast({
        title: "Bulk upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImageSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedImages(files);
  };

  const handleBulkUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedImages.length > 0) {
      bulkUploadMutation.mutate(selectedImages);
    }
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="orders">Orders Summary</TabsTrigger>
            <TabsTrigger value="upload">Upload Menu</TabsTrigger>
            <TabsTrigger value="dishes">View Dishes</TabsTrigger>
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
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Bulk Upload Images</CardTitle>
                <p className="text-sm text-gray-600">Select multiple images from WhatsApp or any folder</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBulkUpload} className="space-y-4">
                  <div>
                    <Label htmlFor="images">Select Images</Label>
                    <Input 
                      id="images" 
                      name="images" 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      required 
                      onChange={handleImageSelection}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Select all images you want to upload at once
                    </p>
                  </div>
                  
                  {selectedImages.length > 0 && (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">Selected Images ({selectedImages.length})</h3>
                      <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                        {selectedImages.map((image, index) => (
                          <div key={index} className="relative">
                            <img 
                              src={URL.createObjectURL(image)} 
                              alt={`Preview ${index + 1}`}
                              className="w-full h-20 object-cover rounded border"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b">
                              {image.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={bulkUploadMutation.isPending || selectedImages.length === 0}
                  >
                    {bulkUploadMutation.isPending ? `Uploading ${uploadProgress}/${selectedImages.length}...` : `Upload ${selectedImages.length} Images`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dishes">
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Dishes ({dishes.length})</CardTitle>
                <p className="text-sm text-gray-600">All dishes in the system</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {dishes.map((dish: any) => (
                    <div key={dish.id} className="border rounded-lg overflow-hidden">
                      {dish.imagePath && (
                        <img 
                          src={dish.imagePath} 
                          alt={dish.name}
                          className="w-full h-32 object-cover"
                        />
                      )}
                      <div className="p-3">
                        <h3 className="font-medium text-sm mb-1">{dish.name}</h3>
                        <p className="text-xs text-gray-600 mb-2">{dish.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold">${dish.price}</span>
                          <Badge variant="secondary" className="text-xs">
                            {dish.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {dish.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {dishes.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No dishes uploaded yet</p>
                  </div>
                )}
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
