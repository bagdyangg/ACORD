import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import DishCard from "@/components/dish-card";
import OrderSummary from "@/components/order-summary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, FileText, Users } from "lucide-react";
import type { Dish, Order } from "@shared/schema";

export default function Dashboard() {
  const [selectedDishes, setSelectedDishes] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState("my-orders");
  const { toast } = useToast();
  const { user } = useAuth();
  
  const today = new Date().toISOString().split('T')[0];
  const isAdmin = user?.role === 'admin';

  // Fetch dishes for today
  const { data: dishes = [], isLoading: dishesLoading } = useQuery<Dish[]>({
    queryKey: ["/api/dishes", { date: today }],
  });

  // Fetch user's existing orders for today
  const { data: existingOrders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders", { date: today }],
  });

  // Fetch orders summary for today (available to all users)
  const { data: ordersSummary } = useQuery({
    queryKey: ["/api/admin/orders", { date: today }],
    retry: false,
    enabled: !!dishes.length, // Only fetch if dishes are loaded
    refetchInterval: 5000, // Refresh every 5 seconds
    refetchOnWindowFocus: true,
  });

  // Get detailed orders data for admin management
  const { data: detailedOrdersData } = useQuery({
    queryKey: ["/api/admin/detailed-orders", { date: today }],
    enabled: isAdmin && activeTab === "all-orders",
    retry: false,
  });

  // Set selected dishes based on existing orders (only for dishes that still exist)
  useEffect(() => {
    if (existingOrders.length > 0 && dishes.length > 0) {
      const validDishIds = dishes.map(dish => dish.id);
      const orderDishIds = existingOrders
        .map(order => order.dishId)
        .filter(dishId => validDishIds.includes(dishId));
      setSelectedDishes(orderDishIds);
    } else {
      setSelectedDishes([]);
    }
  }, [existingOrders, dishes]);

  // Auto-refresh orders data when switching tabs
  useEffect(() => {
    if (isAdmin && activeTab === "all-orders") {
      // Refresh admin orders data when switching to all-orders tab
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/detailed-orders"] });
    }
  }, [activeTab, isAdmin]);

  // Force refresh data periodically for better sync
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAdmin) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      }
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [isAdmin]);

  // Create/update order mutation
  const orderMutation = useMutation({
    mutationFn: async (dishIds: number[]) => {
      const response = await apiRequest("POST", "/api/orders", {
        dishIds,
        date: today,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Order confirmed!",
        description: "Your lunch order has been placed successfully.",
      });
      // Invalidate both personal orders and admin orders data
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/detailed-orders"] });
    },
    onError: (error) => {
      toast({
        title: "Order failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleDishSelection = (dishId: number) => {
    setSelectedDishes(prev => {
      if (prev.includes(dishId)) {
        return prev.filter(id => id !== dishId);
      } else {
        return [...prev, dishId];
      }
    });
  };

  const confirmOrder = () => {
    if (selectedDishes.length === 0) {
      toast({
        title: "No dishes selected",
        description: "Please select at least one dish to order.",
        variant: "destructive",
      });
      return;
    }
    
    orderMutation.mutate(selectedDishes);
  };

  // Export functionality for admin
  const exportOrderSummary = useMutation({
    mutationFn: async () => {
      if (!ordersSummary?.dishCounts) {
        throw new Error("No order data to export");
      }

      const processedImages = [];
      
      for (const [dishId, count] of Object.entries(ordersSummary.dishCounts)) {
        const dish = dishes.find(d => d.id.toString() === dishId);
        if (!dish) continue;

        try {
          // Create canvas for image processing
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          
          await new Promise((resolve, reject) => {
            img.onload = () => {
              canvas.width = img.width;
              canvas.height = img.height;
              
              // Draw original image
              ctx!.drawImage(img, 0, 0);
              
              // Calculate overlay size (32.5% of image dimension)
              const overlaySize = Math.min(img.width, img.height) * 0.325;
              const x = (img.width - overlaySize) / 2;
              const y = (img.height - overlaySize) / 2;
              
              // Draw white square overlay
              ctx!.fillStyle = 'white';
              ctx!.fillRect(x, y, overlaySize, overlaySize);
              
              // Draw black text with quantity
              ctx!.fillStyle = 'black';
              ctx!.font = `bold ${overlaySize * 0.4}px Arial`;
              ctx!.textAlign = 'center';
              ctx!.textBaseline = 'middle';
              ctx!.fillText(
                count.toString(),
                img.width / 2,
                img.height / 2
              );
              
              resolve(true);
            };
            img.onerror = reject;
            img.crossOrigin = 'anonymous';
            img.src = dish.imagePath;
          });

          // Convert to blob
          const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => {
              resolve(blob!);
            }, 'image/jpeg', 0.9);
          });

          const filename = `order_dish_${dish.id}_${today}.jpg`;
          processedImages.push({ blob, filename });

        } catch (error) {
          console.error(`Failed to process image for dish ${dish.id}:`, error);
        }
      }

      return processedImages;
    },
    onSuccess: async (processedImages) => {
      if (processedImages.length === 0) {
        toast({
          title: "Export failed",
          description: "No images could be processed",
          variant: "destructive",
        });
        return;
      }

      try {
        // Use File System Access API for bulk export
        if ('showDirectoryPicker' in window) {
          const dirHandle = await (window as any).showDirectoryPicker();
          
          for (const { blob, filename } of processedImages) {
            const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
          }
          
          toast({
            title: "Export successful",
            description: `${processedImages.length} processed images saved to selected folder`,
          });
        } else {
          // Fallback: download individual files
          for (const { blob, filename } of processedImages) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
          
          toast({
            title: "Export successful",
            description: `${processedImages.length} processed images downloaded`,
          });
        }
      } catch (error) {
        console.error('Export failed:', error);
        toast({
          title: "Export failed",
          description: "Could not save files to selected location",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (dishesLoading) {
    return (
      <div className="min-h-screen bg-neutral">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-md animate-pulse">
                <div className="w-full h-48 bg-gray-300 rounded-t-xl"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-full"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const selectedDishesData = dishes.filter(dish => selectedDishes.includes(dish.id));

  // Render content for regular users (non-admin)
  const renderUserContent = () => (
    <>
      {/* Header Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-secondary mb-2">Today's Menu</h2>
        <p className="text-gray-600">
          Select your lunch preferences for <span className="font-semibold">{formatDate(today)}</span>
        </p>
        <div className="mt-4">
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium inline-block">
            <i className="fas fa-clock mr-1"></i>
            Order deadline: 11:00 AM
          </div>
        </div>
      </div>

      {/* Today's Order Summary for Everyone */}
      {ordersSummary && (
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Today's Order Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{(ordersSummary as any).totalOrders || 0}</div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {(ordersSummary as any).mostPopular?.imagePath ? 'Available' : 'No orders yet'}
              </div>
              <div className="text-sm text-gray-600">Most Popular</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600">
                {(ordersSummary as any).dishCounts ? Object.keys((ordersSummary as any).dishCounts).length : 0}
              </div>
              <div className="text-sm text-gray-600">Different Dishes</div>
            </div>
          </div>
          {(ordersSummary as any).dishCounts && Object.keys((ordersSummary as any).dishCounts).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Object.entries((ordersSummary as any).dishCounts).map(([dishId, count]: [string, any]) => {
                const dish = dishes.find(d => d.id.toString() === dishId);
                return dish ? (
                  <div key={dishId} className="text-center">
                    <img 
                      src={dish.imagePath} 
                      alt="Dish"
                      className="w-16 h-16 object-cover rounded-lg mx-auto mb-1"
                    />
                    <div className="text-xs font-semibold">{count} orders</div>
                  </div>
                ) : null;
              })}
            </div>
          )}
        </div>
      )}

      {/* Menu Grid */}
      {dishes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No dishes available for today</div>
          <p className="text-gray-400 mt-2">Check back later or contact admin</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {dishes.map((dish) => (
            <DishCard
              key={dish.id}
              dish={dish}
              isSelected={selectedDishes.includes(dish.id)}
              onToggle={() => toggleDishSelection(dish.id)}
            />
          ))}
        </div>
      )}
    </>
  );

  // Render admin orders management tab
  const renderAdminOrdersTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-secondary">All Orders Management</h3>
        <div className="flex gap-3">
          <Button
            onClick={() => exportOrderSummary.mutate()}
            disabled={exportOrderSummary.isPending || !ordersSummary || !(ordersSummary as any).dishCounts}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            {exportOrderSummary.isPending ? "Exporting..." : "Export Order Images"}
          </Button>
        </div>
      </div>

      {/* Today's Orders Summary */}
      {ordersSummary && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-xl font-semibold mb-4 text-green-900">Today's Orders</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{(ordersSummary as any).totalOrders || 0}</div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {(ordersSummary as any).mostPopular?.imagePath ? 'Available' : 'No orders yet'}
              </div>
              <div className="text-sm text-gray-600">Most Popular</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600">
                {(ordersSummary as any).dishCounts ? Object.keys((ordersSummary as any).dishCounts).length : 0}
              </div>
              <div className="text-sm text-gray-600">Different Dishes</div>
            </div>
          </div>

          {/* Order Summary Grid */}
          {(ordersSummary as any).dishCounts && Object.keys((ordersSummary as any).dishCounts).length > 0 && (
            <div className="mb-6">
              <h5 className="font-semibold text-lg mb-3 text-green-900">Order Summary</h5>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries((ordersSummary as any).dishCounts).map(([dishKey, count]: [string, any]) => {
                  const dishId = dishKey.replace('dish_', '');
                  const dish = dishes.find((d: any) => d.id.toString() === dishId);
                  return (
                    <div key={dishKey} className="text-center">
                      {dish && (
                        <img 
                          src={dish.imagePath} 
                          alt="Dish"
                          className="w-full h-24 object-cover rounded-lg mb-2"
                        />
                      )}
                      <span className="font-bold text-lg">{count}x</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Orders by Dish - Detailed Table */}
      {ordersSummary && (ordersSummary as any).orders && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-xl font-semibold mb-4">Orders by Dish</h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dish Image</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employees</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(() => {
                  // Group orders by dish
                  const groupedOrders: { [key: string]: { count: number; employees: string[]; dish: any } } = {};
                  
                  (ordersSummary as any).orders?.forEach((order: any) => {
                    const dishKey = `dish_${order.dishId}`;
                    if (!groupedOrders[dishKey]) {
                      const dish = dishes.find((d: any) => d.id === order.dishId);
                      groupedOrders[dishKey] = { 
                        count: 0, 
                        employees: [], 
                        dish: dish 
                      };
                    }
                    groupedOrders[dishKey].count += order.quantity;
                    groupedOrders[dishKey].employees.push(`${order.userName} ${order.userLastName} (${order.quantity}x)`);
                  });

                  return Object.entries(groupedOrders).map(([dishKey, data]) => (
                    <tr key={dishKey}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {data.dish && (
                          <img 
                            src={data.dish.imagePath} 
                            alt="Dish"
                            className="h-16 w-16 object-cover rounded"
                          />
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">
                        {data.count}x
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="space-y-1">
                          {data.employees.map((employee, index) => (
                            <div key={index}>{employee}</div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-xl font-semibold mb-4">Actions</h4>
        <div className="flex flex-wrap gap-4">
          <Button 
            className="bg-blue-600 text-white hover:bg-blue-700"
            disabled={!ordersSummary || (ordersSummary as any).totalOrders === 0}
          >
            Create Order
          </Button>
          <Button 
            style={{ backgroundColor: '#0d9488', color: 'white' }}
            className="hover:bg-teal-700 border-0"
            disabled={!ordersSummary || (ordersSummary as any).totalOrders === 0}
          >
            Send to Restaurant
          </Button>
          <Button 
            variant="outline"
            disabled={!ordersSummary || (ordersSummary as any).totalOrders === 0}
          >
            Export Report
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="font-semibold text-blue-800 mb-2">Management Instructions</h5>
        <div className="text-blue-700 text-sm space-y-2">
          <p><strong>Export Order Images:</strong> Download processed images with quantity overlays for restaurant delivery.</p>
          <p><strong>Create Order:</strong> Generate final order summary for restaurant.</p>
          <p><strong>Send to Restaurant:</strong> Prepare order data for restaurant notification.</p>
          <p><strong>Export Report:</strong> Download detailed order report in CSV format.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-96 md:pb-8">
        {isAdmin ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="my-orders" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                My Orders
              </TabsTrigger>
              <TabsTrigger value="all-orders" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                All Orders
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="my-orders">
              {renderUserContent()}
            </TabsContent>
            
            <TabsContent value="all-orders">
              {renderAdminOrdersTab()}
            </TabsContent>
          </Tabs>
        ) : (
          renderUserContent()
        )}
      </main>

      {/* Order Summary - Fixed on mobile (only for personal orders) */}
      {(!isAdmin || activeTab === "my-orders") && (
        <OrderSummary
          selectedDishes={selectedDishesData}
          onConfirm={confirmOrder}
          isLoading={orderMutation.isPending}
          onRemoveDish={(dishId) => setSelectedDishes(prev => prev.filter(id => id !== dishId))}
        />
      )}
    </div>
  );
}
