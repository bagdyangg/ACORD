import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import PasswordExpiryBanner from "@/components/password-expiry-banner";
import DishCard from "@/components/dish-card";
import OrderSummary from "@/components/order-summary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, FileText, Users, RefreshCw } from "lucide-react";
import type { Dish, Order } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  
  // Redirect superadmin to admin panel - they shouldn't see Dashboard
  if (user?.role === "superadmin") {
    window.location.href = "/admin";
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to Admin Panel...</p>
        </div>
      </div>
    );
  }

  const [dishQuantities, setDishQuantities] = useState<{ [dishId: number]: number }>({});
  const [activeTab, setActiveTab] = useState("my-orders");
  const [processedImages, setProcessedImages] = useState<{ [key: string]: string }>({});
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderViewMode, setOrderViewMode] = useState<'dishes' | 'people'>('dishes');
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const today = new Date().toISOString().split('T')[0];
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  // Manual refresh function for admin
  const handleManualRefresh = async () => {
    await refetchOrdersSummary();
    if (isAdmin && activeTab === "all-orders") {
      await refetchDetailedOrders();
    }
    toast({
      title: "Data refreshed",
      description: "Order statistics have been updated.",
    });
  };

  // Fetch dishes for today
  const { data: dishes = [], isLoading: dishesLoading } = useQuery<Dish[]>({
    queryKey: ["/api/dishes", { date: today }],
  });

  // Fetch user's existing orders for today
  const { data: existingOrders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders", { date: today }],
  });

  // Fetch orders summary for today (available to all users)
  const { data: ordersSummary, refetch: refetchOrdersSummary } = useQuery({
    queryKey: ["/api/admin/orders", { date: today }],
    retry: false,
    enabled: !!dishes.length, // Only fetch if dishes are loaded
    refetchOnWindowFocus: true, // Refetch when tab becomes active
  });

  // Get detailed orders data for admin management
  const { data: detailedOrdersData, refetch: refetchDetailedOrders } = useQuery({
    queryKey: ["/api/admin/detailed-orders", { date: today }],
    enabled: isAdmin && activeTab === "all-orders",
    retry: false,
    refetchOnWindowFocus: true,
  });

  // Set dish quantities based on existing orders (only for dishes that still exist)
  useEffect(() => {
    if (existingOrders.length > 0 && dishes.length > 0) {
      const validDishIds = dishes.map(dish => dish.id);
      const quantities: { [dishId: number]: number } = {};
      
      existingOrders.forEach(order => {
        if (validDishIds.includes(order.dishId)) {
          quantities[order.dishId] = parseFloat(order.quantity?.toString() || "1");
        }
      });
      
      setDishQuantities(quantities);
    } else {
      setDishQuantities({});
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

  // Handle quantity change for a dish
  const handleQuantityChange = (dishId: number, quantity: number) => {
    setDishQuantities(prev => {
      const newQuantities = { ...prev };
      if (quantity === 0) {
        delete newQuantities[dishId];
      } else {
        newQuantities[dishId] = quantity;
      }
      return newQuantities;
    });
  };

  // Create/update order mutation
  const orderMutation = useMutation({
    mutationFn: async (quantities: { [dishId: number]: number }) => {
      const orders = Object.entries(quantities).map(([dishId, quantity]) => ({
        dishId: parseInt(dishId),
        quantity: quantity,
        orderDate: today,
      }));
      
      const response = await apiRequest("/api/orders", {
        method: "POST",
        body: JSON.stringify({ orders }),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Order confirmed!",
        description: "Your lunch order has been placed successfully.",
      });
      // Refresh data immediately after order creation
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/detailed-orders"] });
      
      // Also manually refetch to ensure fresh data
      refetchOrdersSummary();
      if (isAdmin && activeTab === "all-orders") {
        refetchDetailedOrders();
      }
    },
    onError: (error) => {
      toast({
        title: "Order failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete order mutation
  const deleteOrderMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/orders?date=${today}`, {
        method: "DELETE",
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Order deleted",
        description: "Your lunch order has been cancelled successfully.",
      });
      // Clear dish quantities and refresh data
      setDishQuantities({});
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/detailed-orders"] });
      
      // Also manually refetch to ensure fresh data
      refetchOrdersSummary();
      if (isAdmin && activeTab === "all-orders") {
        refetchDetailedOrders();
      }
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create Order functionality - copied from working Admin Panel
  const handleCreateOrder = async () => {
    if (!ordersSummary || !(ordersSummary as any)?.orders || (ordersSummary as any).orders.length === 0) {
      toast({
        title: "No orders found",
        description: "There are no orders for today to process",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingOrder(true);
    
    try {
      // Process the orders to create the combined order structure
      const ordersByDish: { [key: string]: { count: number; employees: string[] } } = {};
      
      (ordersSummary as any).orders.forEach((order: any) => {
        const dishKey = `dish_${order.dishId}`;
        if (!ordersByDish[dishKey]) {
          ordersByDish[dishKey] = { count: 0, employees: [] };
        }
        ordersByDish[dishKey].count += order.quantity;
        ordersByDish[dishKey].employees.push(`${order.userName} ${order.userLastName}`);
      });

      // Create processed images with quantity overlay
      const processedData: { [key: string]: string } = {};
      
      for (const [dishKey, data] of Object.entries(ordersByDish)) {
        const dishId = dishKey.replace('dish_', '');
        const dish = dishes?.find((d: any) => d.id.toString() === dishId);
        
        if (dish) {
          try {
            // Create canvas to add quantity overlay to image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            await new Promise((resolve, reject) => {
              img.onload = () => {
                // Set canvas size to match image
                canvas.width = img.width;
                canvas.height = img.height;
                
                // Draw original image
                ctx?.drawImage(img, 0, 0);
                
                if (ctx) {
                  // Calculate square size and position (increased by 30%)
                  const squareSize = Math.min(canvas.width, canvas.height) * 0.325; // 32.5% of smallest dimension
                  const x = canvas.width - squareSize - 20; // 20px margin from right
                  const y = 20; // 20px margin from top
                  
                  // Add white square background
                  ctx.fillStyle = 'white';
                  ctx.fillRect(x, y, squareSize, squareSize);
                  
                  // Add border to square
                  ctx.strokeStyle = '#ddd';
                  ctx.lineWidth = 2;
                  ctx.strokeRect(x, y, squareSize, squareSize);
                  
                  // Add quantity text
                  ctx.fillStyle = 'black';
                  ctx.font = `bold ${squareSize * 0.6}px Arial`;
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillText(
                    `${data.count}x`, 
                    x + squareSize / 2, 
                    y + squareSize / 2
                  );
                }
                
                resolve(null);
              };
              img.onerror = reject;
              img.src = dish.imagePath;
            });
            
            // Convert canvas to data URL
            processedData[dishKey] = canvas.toDataURL('image/jpeg', 0.9);
          } catch (error) {
            console.error(`Error processing image for ${dishKey}:`, error);
          }
        }
      }
      
      setProcessedImages(processedData);
      
      toast({
        title: "Order created successfully",
        description: `Processed ${Object.keys(processedData).length} dishes with quantity overlays`,
      });
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Error creating order",
        description: "Failed to process images",
        variant: "destructive",
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Send to Restaurant functionality - copied from working Admin Panel
  const handleSendToRestaurant = async () => {
    if (Object.keys(processedImages).length === 0) {
      toast({
        title: "No orders to send",
        description: "Please create an order first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if File System Access API is supported
      if ('showDirectoryPicker' in window) {
        // Use modern File System Access API
        const directoryHandle = await (window as any).showDirectoryPicker({
          mode: 'readwrite'
        });

        // Save each processed image to the selected directory
        for (const [dishKey, imageData] of Object.entries(processedImages)) {
          try {
            const fileName = `order_${dishKey}_${today}.jpg`;
            const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
            
            // Convert data URL to blob
            const response = await fetch(imageData);
            const blob = await response.blob();
            
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
          } catch (error) {
            console.error(`Failed to save ${dishKey}:`, error);
          }
        }

        toast({
          title: "Order images saved",
          description: `${Object.keys(processedImages).length} images saved to selected folder`,
        });
      } else {
        // Fallback to traditional download method
        Object.entries(processedImages).forEach(([dishKey, imageData], index) => {
          try {
            const link = document.createElement('a');
            link.href = imageData;
            link.download = `order_${dishKey}_${today}.jpg`;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            
            setTimeout(() => {
              link.click();
              document.body.removeChild(link);
            }, index * 300);
            
          } catch (error) {
            console.error(`Failed to download ${dishKey}:`, error);
          }
        });

        toast({
          title: "Downloading order images",
          description: `${Object.keys(processedImages).length} images are being downloaded`,
        });
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast({
          title: "Operation cancelled",
          description: "Folder selection was cancelled",
        });
      } else {
        console.error('Error saving files:', error);
        toast({
          title: "Error saving files",
          description: "Failed to save order images",
          variant: "destructive",
        });
      }
    }
  };

  // Export Report functionality
  const handleExportReport = () => {
    alert("handleExportReport function started!");
    console.log("handleExportReport called");
    if (!detailedOrdersData || (detailedOrdersData as any).length === 0) {
      toast({
        title: "No data to export",
        description: "Please select a date with orders first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create CSV content
      const csvHeaders = ['firstName', 'lastName', 'username', 'dishId', 'quantity', 'timestamp'];
      const csvData = [csvHeaders.join(',')];

      (detailedOrdersData as any[])?.forEach((order: any) => {
        const row = [
          order.userName || '',
          order.userLastName || '',
          order.userUsername || '',
          order.dishId || '',
          order.quantity || '',
          order.createdAt || ''
        ];
        csvData.push(row.join(','));
      });

      // Create and download file
      const csvContent = csvData.join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `orders_report_${today}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      alert("Export Report Successfully!");
      toast({
        title: "Report exported",
        description: "Orders report has been downloaded successfully",
      });
    } catch (error) {
      console.error("Error exporting report:", error);
      toast({
        title: "Export failed",
        description: "Failed to export report",
        variant: "destructive",
      });
    }
  };

  const confirmOrder = () => {
    if (Object.keys(dishQuantities).length === 0) {
      toast({
        title: "No dishes selected",
        description: "Please select at least one dish to order.",
        variant: "destructive",
      });
      return;
    }
    
    orderMutation.mutate(dishQuantities);
  };

  // Export functionality for admin
  const exportOrderSummary = useMutation({
    mutationFn: async () => {
      if (!(ordersSummary as any)?.dishCounts) {
        throw new Error("No order data to export");
      }

      const processedImages = [];
      
      for (const [dishId, count] of Object.entries((ordersSummary as any).dishCounts)) {
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
                (count as number).toString(),
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
      <div className="min-h-screen bg-neutral dark:bg-gray-900">
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

  const selectedDishesData = dishes.filter(dish => dishQuantities[dish.id] > 0).map(dish => ({
    ...dish,
    selectedQuantity: dishQuantities[dish.id]
  }));

  // Render content for regular users (non-admin)
  const renderUserContent = () => (
    <>
      {/* Password Expiry Banner */}
      <PasswordExpiryBanner />

      {/* Header Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-secondary mb-2">Today's Menu</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Select your lunch preferences for <span className="font-semibold">{formatDate(today)}</span>
        </p>
        <div className="mt-4">
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium inline-block">
            <i className="fas fa-clock mr-1"></i>
            Order deadline: 11:00 AM
          </div>
        </div>
      </div>



      {/* Menu Grid */}
      {dishes.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <div className="text-gray-500 text-base sm:text-lg">No dishes available for today</div>
          <p className="text-gray-400 mt-2 text-sm sm:text-base">Check back later or contact admin</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-20 sm:mb-8">
          {dishes.map((dish) => (
            <DishCard
              key={dish.id}
              dish={dish}
              selectedQuantity={dishQuantities[dish.id] || 0}
              onQuantityChange={handleQuantityChange}
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
      </div>

      {/* Today's Orders Summary */}
      {ordersSummary && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xl font-semibold text-green-900">Today's Orders</h4>
            <Button
              onClick={handleManualRefresh}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{(ordersSummary as any).totalOrders || 0}</div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600">
                {(ordersSummary as any).dishCounts ? Object.keys((ordersSummary as any).dishCounts).length : 0}
              </div>
              <div className="text-sm text-gray-600">Different Dishes</div>
            </div>
          </div>


        </div>
      )}

      {/* Orders Analysis - Combined View */}
      {ordersSummary && (ordersSummary as any).orders && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xl font-semibold">Orders Analysis</h4>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setOrderViewMode('dishes')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  orderViewMode === 'dishes' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                By Dishes
              </button>
              <button
                onClick={() => setOrderViewMode('people')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  orderViewMode === 'people' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                By People
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {orderViewMode === 'dishes' ? (
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
                              className="h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 object-cover rounded-lg shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setEnlargedImage(data.dish.imagePath)}
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
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Dishes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ordered Dishes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(() => {
                    // Group orders by user
                    const groupedByUser: { [key: string]: { count: number; dishes: any[]; user: any } } = {};
                    
                    (ordersSummary as any).orders?.forEach((order: any) => {
                      const userKey = `${order.userName}_${order.userLastName}`;
                      if (!groupedByUser[userKey]) {
                        groupedByUser[userKey] = { 
                          count: 0, 
                          dishes: [],
                          user: {
                            firstName: order.userName,
                            lastName: order.userLastName,
                            username: order.userUsername
                          }
                        };
                      }
                      groupedByUser[userKey].count += order.quantity;
                      
                      // Find dish details
                      const dish = dishes.find((d: any) => d.id === order.dishId);
                      if (dish) {
                        groupedByUser[userKey].dishes.push({
                          dish: dish,
                          quantity: order.quantity
                        });
                      }
                    });

                    return Object.entries(groupedByUser).map(([userKey, data]) => (
                      <tr key={userKey}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {data.user.firstName} {data.user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{data.user.username}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">
                          {data.count} dishes
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {data.dishes.map((item, index) => (
                              <div key={index} className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3 shadow-sm">
                                {item.dish && (
                                  <img 
                                    src={item.dish.imagePath} 
                                    alt="Dish"
                                    className="h-12 w-12 sm:h-14 sm:w-14 object-cover rounded-lg flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => setEnlargedImage(item.dish.imagePath)}
                                  />
                                )}
                                <span className="text-sm font-medium text-gray-800">{item.quantity}x</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-xl font-semibold mb-4">Actions</h4>
        <div className="flex flex-wrap gap-4">
          <Button 
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={handleCreateOrder}
            disabled={isCreatingOrder || !ordersSummary || (ordersSummary as any).totalOrders === 0}
          >
            {isCreatingOrder ? "Processing..." : "Create Order"}
          </Button>
          <Button 
            className="bg-accent text-white hover:bg-teal-600"
            onClick={handleSendToRestaurant}
            disabled={Object.keys(processedImages).length === 0}
          >
            Send to Restaurant
          </Button>
          <Button 
            variant="outline"
            onClick={handleExportReport}
          >
            Export Report
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="font-semibold text-blue-800 mb-2">Management Instructions</h5>
        <div className="text-blue-700 text-sm space-y-2">
          <p><strong>Create Order:</strong> Generate final order summary with quantity overlays for restaurant.</p>
          <p><strong>Send to Restaurant:</strong> Save processed images to selected folder for restaurant delivery.</p>
          <p><strong>Export Report:</strong> Download detailed order report in CSV format.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral dark:bg-gray-900 smooth-scroll">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8 pb-24 md:pb-8 safe-area-inset-bottom">
        {isAdmin ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-8">
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
          onRemoveDish={(dishId) => handleQuantityChange(dishId, 0)}
          onDeleteOrder={() => deleteOrderMutation.mutate()}
          hasExistingOrder={existingOrders.length > 0}
          isDeleting={deleteOrderMutation.isPending}
        />
      )}

      {/* Image Enlargement Modal */}
      {enlargedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img 
              src={enlargedImage} 
              alt="Enlarged dish"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-pointer"
              onClick={() => setEnlargedImage(null)}
            />
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute top-4 right-4 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
