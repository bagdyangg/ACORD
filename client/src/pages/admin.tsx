import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import PasswordManagement from "@/components/admin/password-management";
import PasswordPolicySettings from "@/components/admin/password-policy-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, UserPlus, Upload, FileText, Download, Calendar, Trash2, AlertTriangle, Shield } from "lucide-react";
import { Link } from "wouter";
import type { User, Dish } from "@shared/schema";

export default function Admin() {
  console.log("=== Admin component rendered ===");
  const { user } = useAuth();
  console.log("=== Auth hook result ===", { user });
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(user?.role === "admin" ? "menu" : "passwords");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedDishes, setSelectedDishes] = useState<number[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [processedImages, setProcessedImages] = useState<{ [key: string]: string }>({});
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', username: '', role: '' });
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [createForm, setCreateForm] = useState({ firstName: '', lastName: '', username: '', role: 'employee', password: '' });
  const [showImportUsers, setShowImportUsers] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  
  const today = new Date().toISOString().split('T')[0];

  // Debug: log user data
  console.log("Admin page - user data:", user);
  console.log("Admin page - user role:", user?.role);
  
  // Check if user is admin or superadmin
  if (user?.role !== "admin" && user?.role !== "superadmin") {
    return (
      <div className="min-h-screen bg-neutral">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
              <p className="text-gray-600">You don't have permission to access the admin panel.</p>
              <p className="text-sm text-gray-500 mt-2">Your role: {user?.role || "unknown"}</p>
              <Link href="/">
                <Button className="mt-4">Go to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Fetch dishes
  const { data: dishes, isLoading: dishesLoading } = useQuery({
    queryKey: ["/api/dishes"],
  });

  // Fetch orders for today
  const { data: orders } = useQuery({
    queryKey: ["/api/orders"],
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always consider data stale
  });

  // Fetch orders summary for admin
  const { data: ordersSummary } = useQuery({
    queryKey: ["/api/admin/orders"],
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 0, // Always consider data stale
  });

  // Fetch users (admin only)
  const { data: users } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: user?.role === "admin" || user?.role === "superadmin",
  });

  // Upload dishes mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/dishes", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Images uploaded successfully!",
      });
      setSelectedImages([]);
      setUploadProgress(0);
      queryClient.invalidateQueries({ queryKey: ["/api/dishes"] });
    },
    onError: (error: any) => {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload images",
        variant: "destructive",
      });
    },
  });

  // Delete dish mutation
  const deleteDishMutation = useMutation({
    mutationFn: async (dishId: number) => {
      await apiRequest(`/api/dishes/${dishId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Dish deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dishes"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete dish",
        variant: "destructive",
      });
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      return await apiRequest("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User created successfully",
      });
      setShowCreateUser(false);
      setCreateForm({ firstName: '', lastName: '', username: '', role: 'employee', password: '' });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: string; userData: any }) => {
      return await apiRequest(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return await apiRequest(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  // Import users mutation
  const importUsersMutation = useMutation({
    mutationFn: async (users: any[]) => {
      return await apiRequest("/api/admin/import-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users }),
      });
    },
    onSuccess: (result) => {
      toast({
        title: "Import Complete",
        description: `${result.created} users created, ${result.updated} users updated`,
      });
      setShowImportUsers(false);
      setCsvFile(null);
      setCsvPreview([]);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import users",
        variant: "destructive",
      });
    },
  });

  // Clear today's data mutation
  const clearTodayDataMutation = useMutation({
    mutationFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      return await apiRequest("/api/admin/clear-today", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Данные очищены",
        description: "Все блюда и заказы за сегодня удалены. Можете загружать новое меню.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dishes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось очистить данные",
        variant: "destructive",
      });
    },
  });

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedImages.length === 0) {
      toast({
        title: "No images selected",
        description: "Please select at least one image to upload",
        variant: "destructive",
      });
      return;
    }

    // Upload images one by one since backend expects single file uploads
    let successCount = 0;
    for (const file of selectedImages) {
      try {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("date", today);
        
        await uploadMutation.mutateAsync(formData);
        successCount++;
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
      }
    }

    if (successCount > 0) {
      toast({
        title: "Upload completed",
        description: `${successCount} out of ${selectedImages.length} images uploaded successfully`,
      });
      setSelectedImages([]);
      setUploadProgress(0);
    }
  };

  const handleSelectDish = (dishId: number) => {
    setSelectedDishes(prev => 
      prev.includes(dishId) 
        ? prev.filter(id => id !== dishId)
        : [...prev, dishId]
    );
  };

  const handleSelectAll = () => {
    if (dishes && Array.isArray(dishes)) {
      const allDishIds = dishes.map((dish: any) => dish.id);
      setSelectedDishes(allDishIds);
    }
  };

  const handleClearSelection = () => {
    setSelectedDishes([]);
  };

  const handleDeleteSelected = async () => {
    for (const dishId of selectedDishes) {
      try {
        await deleteDishMutation.mutateAsync(dishId);
      } catch (error) {
        console.error(`Failed to delete dish ${dishId}:`, error);
      }
    }
    setSelectedDishes([]);
    setIsSelectMode(false);
  };

  const handleCreateOrder = async () => {
    if (!ordersSummary || !ordersSummary.orders || ordersSummary.orders.length === 0) {
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
      
      ordersSummary.orders.forEach((order: any) => {
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
                  const squareSize = Math.min(canvas.width, canvas.height) * 0.325; // 32.5% of smallest dimension (25% + 30%)
                  const x = canvas.width - squareSize - 20; // 20px margin from right
                  const y = 20; // 20px margin from top
                  
                  // Add white square background
                  ctx.fillStyle = 'white';
                  ctx.fillRect(x, y, squareSize, squareSize);
                  
                  // Add border to square
                  ctx.strokeStyle = '#ddd';
                  ctx.lineWidth = 2;
                  ctx.strokeRect(x, y, squareSize, squareSize);
                  
                  // Add quantity text (font size also increased proportionally)
                  ctx.fillStyle = 'black';
                  ctx.font = `bold ${squareSize * 0.6}px Arial`; // Font size remains 60% of the now larger square
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillText(
                    `${data.count}x`, 
                    x + squareSize / 2, 
                    y + squareSize / 2
                  );
                }
                
                // Convert canvas to data URL
                const processedImageData = canvas.toDataURL('image/jpeg', 0.9);
                processedData[dishKey] = processedImageData;
                resolve(void 0);
              };
              
              img.onerror = reject;
              img.crossOrigin = 'anonymous';
              img.src = dish.imagePath;
            });
          } catch (error) {
            console.error(`Failed to process image for ${dishKey}:`, error);
            // Fallback to original image
            processedData[dishKey] = dish.imagePath;
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

        for (const [dishKey, imageData] of Object.entries(processedImages)) {
          try {
            // Convert data URL to blob
            const response = await fetch(imageData);
            const blob = await response.blob();
            
            // Create file in selected directory
            const fileHandle = await directoryHandle.getFileHandle(
              `order_${dishKey}_${today}.jpg`,
              { create: true }
            );
            
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
    } catch (error) {
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

  const handleExportUsers = async () => {
    try {
      if (!users || users.length === 0) {
        toast({
          title: "No users to export",
          description: "There are no users in the system to export",
          variant: "destructive",
        });
        return;
      }

      // Create CSV content
      const headers = ['ID', 'Username', 'First Name', 'Last Name', 'Role', 'Created At'];
      const csvContent = [
        headers.join(','),
        ...users.map(user => [
          user.id,
          user.username,
          user.firstName || '',
          user.lastName || '',
          user.role,
          user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast({
        title: "Export completed",
        description: `Exported ${users.length} users to CSV file`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "Failed to export users data",
        variant: "destructive",
      });
    }
  };

  const handleExportReport = () => {
    if (!ordersSummary || !ordersSummary.orders) {
      toast({
        title: "Нет данных для экспорта",
        description: "Сначала выберите дату с заказами",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create CSV content
      const csvHeaders = ['firstName', 'lastName', 'username', 'dishId', 'quantity', 'timestamp'];
      const csvData = [csvHeaders.join(',')];

      ordersSummary.orders.forEach((order: any) => {
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
      }

      toast({
        title: "Экспорт завершен",
        description: `Отчет сохранен как orders_report_${today}.csv`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Ошибка экспорта",
        description: "Не удалось создать отчет",
        variant: "destructive",
      });
    }
  };

  const parseCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return obj;
      });
      
      setCsvPreview(data);
    };
    reader.readAsText(file);
  };

  const handleImportUsers = () => {
    if (csvPreview.length === 0) {
      toast({
        title: "No data to import",
        description: "Please select and preview a CSV file first",
        variant: "destructive",
      });
      return;
    }

    importUsersMutation.mutate(csvPreview);
  };

  const startEditUser = (user: any) => {
    setEditingUser(user);
    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || '',
      role: user.role || 'employee'
    });
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;
    
    // Check if only role is being changed
    const originalUser = editingUser;
    const isOnlyRoleChange = (
      editForm.firstName === originalUser.firstName &&
      editForm.lastName === originalUser.lastName &&
      editForm.username === originalUser.username &&
      editForm.role !== originalUser.role
    );
    
    if (isOnlyRoleChange) {
      // Use role-specific mutation
      updateUserRoleMutation.mutate({
        userId: editingUser.id,
        role: editForm.role
      });
    } else {
      // Use general user update mutation
      updateUserMutation.mutate({
        id: editingUser.id,
        userData: editForm
      });
    }
  };

  const handleNewDaySetup = () => {
    if (window.confirm("Это действие удалит все блюда и заказы за сегодня. Вы уверены?")) {
      clearTodayDataMutation.mutate();
    }
  };

  const handleCreateUser = () => {
    if (!createForm.firstName || !createForm.lastName || !createForm.username || !createForm.password) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createUserMutation.mutate(createForm);
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  return (
    <div className="min-h-screen bg-neutral dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
          {user?.role === "admin" && (
            <Link href="/">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {user?.role === "admin" ? (
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="menu">Menu Management</TabsTrigger>
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="passwords">Password Management</TabsTrigger>
              <TabsTrigger value="policy">Password Policy</TabsTrigger>
            </TabsList>
          ) : (
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="passwords">Password Management</TabsTrigger>
              <TabsTrigger value="policy">Password Policy</TabsTrigger>
            </TabsList>
          )}

          {user?.role === "admin" && (
            <TabsContent value="menu" className="space-y-6">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Upload Today's Menu</CardTitle>
                <p className="text-sm text-gray-600">Select multiple images from WhatsApp or any folder</p>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-purple-900">WhatsApp Folder Setup</h3>
                      <p className="text-sm text-purple-700">Set default folder for quick access</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      onClick={() => {
                        const isWindows = navigator.platform.indexOf('Win') > -1;
                        const isMac = navigator.platform.indexOf('Mac') > -1;
                        
                        let instructions = "";
                        if (isWindows) {
                          instructions = "Windows: Press Win+R, type %USERPROFILE%\\AppData\\Local\\Packages and look for WhatsApp folders";
                        } else if (isMac) {
                          instructions = "Mac: Press Cmd+Shift+G, paste ~/Library/Group Containers/group.net.whatsapp.WhatsApp.shared/Media";
                        } else {
                          instructions = "Navigate to your WhatsApp Media folder in file manager";
                        }
                        
                        toast({
                          title: "WhatsApp Folder Location",
                          description: instructions,
                          duration: 8000,
                        });
                      }}
                    >
                      Show Path
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="images">Select Images</Label>
                    <Input
                      id="images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="mt-1"
                    />
                  </div>

                  {selectedImages.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">
                          {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                        {selectedImages.map((file, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Selected ${index}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <X size={16} />
                            </button>
                            <p className="text-xs text-gray-500 mt-1 truncate">{file.name}</p>
                          </div>
                        ))}
                      </div>

                      <Button 
                        onClick={handleUpload} 
                        disabled={uploadMutation.isPending}
                        className="w-full"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {uploadMutation.isPending ? "Uploading..." : "Upload Images"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Today's Dishes</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNewDaySetup}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      New Day Setup
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsSelectMode(!isSelectMode)}
                    >
                      {isSelectMode ? "Cancel" : "Select Mode"}
                    </Button>
                    {isSelectMode && (
                      <>
                        <Button variant="outline" size="sm" onClick={handleSelectAll}>
                          Select All
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleClearSelection}>
                          Clear
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={handleDeleteSelected}
                          disabled={selectedDishes.length === 0}
                        >
                          Delete Selected ({selectedDishes.length})
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {dishesLoading ? (
                  <p>Loading dishes...</p>
                ) : dishes && Array.isArray(dishes) && dishes.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {dishes.map((dish: any) => (
                      <div key={dish.id} className="relative">
                        {isSelectMode && (
                          <div className="absolute top-2 left-2 z-10">
                            <input
                              type="checkbox"
                              checked={selectedDishes.includes(dish.id)}
                              onChange={() => handleSelectDish(dish.id)}
                              className="w-4 h-4"
                            />
                          </div>
                        )}
                        <div className={`border rounded-lg overflow-hidden ${selectedDishes.includes(dish.id) ? 'ring-2 ring-blue-500' : ''}`}>
                          <img
                            src={dish.imagePath}
                            alt="Dish"
                            className="w-full h-48 object-cover"
                          />
                          <div className="p-3">
                            <p className="text-sm text-gray-500">
                              Uploaded: {new Date(dish.createdAt).toLocaleDateString()}
                            </p>
                            {!isSelectMode && (
                              <Button
                                variant="destructive"
                                size="sm"
                                className="mt-2 w-full"
                                onClick={() => deleteDishMutation.mutate(dish.id)}
                                disabled={deleteDishMutation.isPending}
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No dishes uploaded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            </TabsContent>
          )}

          <TabsContent value="passwords">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Password Management</span>
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Manage user passwords, reset credentials, and configure password policies
                </p>
              </CardHeader>
              <CardContent>
                {users && Array.isArray(users) && users.length > 0 ? (
                  <div className="space-y-4">
                    {users.map((userData: any) => (
                      <PasswordManagement key={userData.id} user={userData} />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No users found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="policy">
            <PasswordPolicySettings />
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Registered Users</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowCreateUser(true)}
                      size="sm"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add User
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowImportUsers(true)}
                      size="sm"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Import CSV
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleExportUsers}
                      size="sm"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {users && Array.isArray(users) && users.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {users.map((userData: any) => (
                          <tr key={userData.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {userData.firstName} {userData.lastName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {userData.username}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={userData.role === 'admin' ? 'default' : userData.role === 'superadmin' ? 'destructive' : 'secondary'}>
                                {userData.role}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(userData.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditUser(userData)}
                              >
                                Edit
                              </Button>
                              {userData.role !== 'superadmin' && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteUser(userData.id)}
                                >
                                  Delete
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No users found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create User Modal */}
        {showCreateUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Create New User</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={createForm.username}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={createForm.role} onValueChange={(value) => setCreateForm(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      {user?.role === 'superadmin' && <SelectItem value="superadmin">Super Admin</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateUser(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateUser} disabled={createUserMutation.isPending}>
                    {createUserMutation.isPending ? "Creating..." : "Create User"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Edit User</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="editFirstName">First Name</Label>
                  <Input
                    id="editFirstName"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="editLastName">Last Name</Label>
                  <Input
                    id="editLastName"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="editUsername">Username</Label>
                  <Input
                    id="editUsername"
                    value={editForm.username}
                    onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="editRole">Role</Label>
                  <Select value={editForm.role} onValueChange={(value) => setEditForm(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      {user?.role === 'superadmin' && <SelectItem value="superadmin">Super Admin</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setEditingUser(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateUser} disabled={updateUserMutation.isPending}>
                    {updateUserMutation.isPending ? "Updating..." : "Update User"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Import Users Modal */}
        {showImportUsers && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Import Users from CSV</CardTitle>
                <p className="text-sm text-gray-600">
                  CSV should have columns: firstName, lastName, username, role, password
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="csvFile">Select CSV File</Label>
                  <Input
                    id="csvFile"
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setCsvFile(file);
                        parseCsvFile(file);
                      }
                    }}
                  />
                </div>

                {csvPreview.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Preview ({csvPreview.length} users)</h4>
                    <div className="max-h-64 overflow-y-auto border rounded">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-2 py-1 text-left">First Name</th>
                            <th className="px-2 py-1 text-left">Last Name</th>
                            <th className="px-2 py-1 text-left">Username</th>
                            <th className="px-2 py-1 text-left">Role</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvPreview.slice(0, 10).map((row, index) => (
                            <tr key={index} className="border-t">
                              <td className="px-2 py-1">{row.firstName}</td>
                              <td className="px-2 py-1">{row.lastName}</td>
                              <td className="px-2 py-1">{row.username}</td>
                              <td className="px-2 py-1">{row.role || 'employee'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {csvPreview.length > 10 && (
                        <p className="text-xs text-gray-500 p-2">... and {csvPreview.length - 10} more</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setShowImportUsers(false);
                    setCsvFile(null);
                    setCsvPreview([]);
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleImportUsers} 
                    disabled={importUsersMutation.isPending || csvPreview.length === 0}
                  >
                    {importUsersMutation.isPending ? "Importing..." : "Import Users"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}