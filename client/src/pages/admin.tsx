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
  const [activeTab, setActiveTab] = useState("menu");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [processedImages, setProcessedImages] = useState<{ [key: string]: string }>({});
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', role: '' });
  
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
        formData.append("image", image);
        
        try {
          const response = await fetch("/api/dishes", {
            method: "POST",
            body: formData,
            credentials: "include",
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }
          
          const result = await response.json();
          results.push(result);
          setUploadProgress(i + 1);
        } catch (error) {
          console.error(`Error uploading ${image.name}:`, error);
          throw new Error(`Failed to upload ${image.name}: ${error.message}`);
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

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const firstName = formData.get('newUserFirstName') as string;
    const lastName = formData.get('newUserLastName') as string;
    const role = formData.get('newUserRole') as string;
    const email = formData.get('newUserEmail') as string;

    try {
      const userData = {
        id: `user_${Date.now()}`, // Auto-generate ID
        firstName,
        lastName,
        role,
        ...(role === 'admin' ? { email } : {}) // Only add email for admins
      };

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include'
      });

      if (response.ok) {
        toast({
          title: "User created successfully!",
          description: `${firstName} ${lastName} has been added as ${role}`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
        e.currentTarget.reset();
      } else {
        throw new Error('Failed to create user');
      }
    } catch (error) {
      toast({
        title: "Error creating user",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
        credentials: 'include'
      });

      if (response.ok) {
        toast({
          title: "Role updated!",
          description: `User role changed to ${newRole}`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      } else {
        throw new Error('Failed to update role');
      }
    } catch (error) {
      toast({
        title: "Error updating role",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDish = async (dishId: number) => {
    if (!confirm('Are you sure you want to delete this dish?')) return;

    try {
      const response = await fetch(`/api/dishes/${dishId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast({
          title: "Dish deleted!",
          description: "The dish has been removed from today's menu",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/dishes"] });
      } else {
        throw new Error('Failed to delete dish');
      }
    } catch (error) {
      toast({
        title: "Error deleting dish",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || ''
    });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
        credentials: 'include'
      });

      if (response.ok) {
        toast({
          title: "User updated successfully!",
          description: `${editForm.firstName} ${editForm.lastName} has been updated`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
        setEditingUser(null);
        setEditForm({ firstName: '', lastName: '', email: '', role: '' });
      } else {
        throw new Error('Failed to update user');
      }
    } catch (error) {
      toast({
        title: "Error updating user",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast({
          title: "User deleted!",
          description: "The user has been removed from the system",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (error) {
      toast({
        title: "Error deleting user",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleCreateOrder = async () => {
    if (!ordersSummary || !dishes) return;
    
    setIsCreatingOrder(true);
    const processed: { [key: string]: string } = {};
    
    try {
      // Получаем только блюда которые были заказаны с суммарным количеством
      const orderedDishes = Object.entries(ordersSummary.dishCounts || {})
        .map(([dishKey, totalCount]) => {
          const dishId = dishKey.replace('dish_', '');
          const dish = (dishes as any[]).find((d: any) => d.id.toString() === dishId);
          return { dish, count: totalCount as number };
        })
        .filter(item => item.dish);

      for (const { dish, count } of orderedDishes) {
        // Загружаем изображение
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = dish.imagePath;
        });

        // Создаем canvas для обработки
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = img.width;
        canvas.height = img.height;

        // Рисуем оригинальное изображение
        ctx.drawImage(img, 0, 0);

        // Добавляем белый квадрат с количеством
        const squareSize = Math.min(img.width, img.height) * 0.2;
        const x = img.width - squareSize - 20;
        const y = 20;

        // Белый квадрат
        ctx.fillStyle = 'white';
        ctx.fillRect(x, y, squareSize, squareSize);
        
        // Черная рамка
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, squareSize, squareSize);

        // Текст с количеством
        ctx.fillStyle = 'black';
        ctx.font = `bold ${squareSize * 0.4}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          count.toString(), 
          x + squareSize / 2, 
          y + squareSize / 2
        );

        // Конвертируем в base64
        const processedImageData = canvas.toDataURL('image/jpeg', 0.9);
        processed[`dish_${dish.id}`] = processedImageData;
      }

      setProcessedImages(processed);
      
      toast({
        title: "Заказ готов!",
        description: `Обработано ${Object.keys(processed).length} изображений с количеством заказов`,
      });
      
    } catch (error) {
      toast({
        title: "Ошибка обработки",
        description: "Не удалось обработать изображения",
        variant: "destructive",
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleSendToRestaurant = async () => {
    if (!ordersSummary || Object.keys(processedImages).length === 0) {
      toast({
        title: "Ошибка",
        description: "Сначала создайте заказ с помощью кнопки 'Create Order'",
        variant: "destructive",
      });
      return;
    }

    try {
      // Проверяем поддержку File System Access API
      if ('showDirectoryPicker' in window) {
        const dirHandle = await (window as any).showDirectoryPicker();
        
        // Сохраняем каждое обработанное изображение
        for (const [dishKey, imageData] of Object.entries(processedImages)) {
          const response = await fetch(imageData);
          const blob = await response.blob();
          
          const fileHandle = await dirHandle.getFileHandle(`${dishKey}_order_${today}.jpg`, {
            create: true,
          });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
        }
        
        toast({
          title: "Изображения экспортированы!",
          description: `Сохранено ${Object.keys(processedImages).length} изображений в выбранную папку`,
        });
      } else {
        // Fallback для браузеров без поддержки File System Access API
        for (const [dishKey, imageData] of Object.entries(processedImages)) {
          const link = document.createElement('a');
          link.href = imageData;
          link.download = `${dishKey}_order_${today}.jpg`;
          link.click();
        }
        
        toast({
          title: "Изображения скачаны!",
          description: `Скачано ${Object.keys(processedImages).length} изображений`,
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка экспорта",
        description: "Не удалось экспортировать изображения",
        variant: "destructive",
      });
    }
  };

  const handleExportReport = () => {
    if (!ordersSummary) return;
    
    // Создаем CSV отчет
    const csvHeader = "Employee,Email,Dish ID,Quantity,Time\n";
    const csvData = ordersSummary.orders?.map((order: any) => 
      `"${order.userName} ${order.userLastName}","${order.userEmail}","${order.dishId}","${order.quantity}","${new Date(order.createdAt).toLocaleString()}"`
    ).join('\n') || '';
    
    const csv = csvHeader + csvData;
    
    // Создаем и скачиваем файл
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lunch-orders-${today}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Отчет экспортирован!",
      description: `Файл lunch-orders-${today}.csv загружен`,
    });
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="menu">Menu Management</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dish Image</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {ordersSummary.orders?.map((order: any, index: number) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {order.userName} {order.userLastName}
                              </td>
                              <td className="px-6 py-4">
                                {order.dishImagePath && (
                                  <img 
                                    src={order.dishImagePath} 
                                    alt="Dish" 
                                    className="w-16 h-12 object-cover rounded"
                                  />
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">{order.quantity}</td>
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

                <div className="flex flex-wrap gap-4">
                  <Button 
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    onClick={handleCreateOrder}
                    disabled={isCreatingOrder || !ordersSummary || ordersSummary.totalOrders === 0}
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

                {/* Показываем превью обработанных изображений */}
                {Object.keys(processedImages).length > 0 && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Processed Order Images</CardTitle>
                      <p className="text-sm text-gray-600">Images ready for restaurant with order quantities</p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Object.entries(processedImages).map(([dishKey, imageData]) => (
                          <div key={dishKey} className="border rounded-lg overflow-hidden">
                            <img 
                              src={imageData} 
                              alt={`Processed ${dishKey}`}
                              className="w-full h-32 object-cover"
                            />
                            <div className="p-2 text-center">
                              <p className="text-xs text-gray-600">{dishKey}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="menu" className="space-y-6">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Upload Today's Menu</CardTitle>
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
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-800 font-medium">💡 Tip: WhatsApp Images Location</p>
                      <p className="text-xs text-blue-600 mt-1">
                        • <strong>Windows:</strong> C:\Users\[Username]\AppData\Local\Packages\5319275A.WhatsAppDesktop_cv1g1gvanyjgm\LocalState\shared\transfers
                      </p>
                      <p className="text-xs text-blue-600">
                        • <strong>Mac:</strong> ~/Library/Group Containers/group.net.whatsapp.WhatsApp.shared/Media/WhatsApp Images
                      </p>
                      <p className="text-xs text-blue-600">
                        • <strong>Phone:</strong> Navigate to WhatsApp Media folder in your file manager
                      </p>
                    </div>
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

            <Card>
              <CardHeader>
                <CardTitle>Today's Menu ({dishes.length} dishes)</CardTitle>
                <p className="text-sm text-gray-600">All uploaded dishes for today</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {dishes.map((dish: any) => (
                    <div key={dish.id} className="border rounded-lg overflow-hidden bg-white shadow-sm relative group">
                      {dish.imagePath && (
                        <img 
                          src={dish.imagePath} 
                          alt="Dish"
                          className="w-full h-32 object-cover"
                        />
                      )}
                      <div className="p-2">
                        <p className="text-xs text-gray-500 text-center">
                          {dish.date}
                        </p>
                        <p className="text-xs text-gray-400 text-center mt-1">
                          ID: {dish.id}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteDish(dish.id)}
                      >
                        ×
                      </Button>
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((user: any) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditUser(user)}
                              >
                                Edit
                              </Button>
                              {user.id !== 'superadmin-001' && (
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{user.email || 'No email'}</td>
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

          <TabsContent value="manage-users">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create New User</CardTitle>
                  <p className="text-sm text-gray-600">Only administrators can create new users</p>
                </CardHeader>
                <CardContent>
                  <form className="grid grid-cols-2 gap-4 max-w-2xl" onSubmit={handleCreateUser}>
                    <div>
                      <Label htmlFor="newUserFirstName">First Name</Label>
                      <Input id="newUserFirstName" placeholder="John" required />
                    </div>
                    <div>
                      <Label htmlFor="newUserLastName">Last Name</Label>
                      <Input id="newUserLastName" placeholder="Doe" required />
                    </div>
                    <div>
                      <Label htmlFor="newUserRole">Role</Label>
                      <Select name="newUserRole" onValueChange={(value) => {
                        const emailField = document.getElementById('emailField');
                        if (emailField) {
                          emailField.style.display = value === 'admin' ? 'block' : 'none';
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div id="emailField" style={{display: 'none'}} className="col-span-2">
                      <Label htmlFor="newUserEmail">Email (только для администратора)</Label>
                      <Input id="newUserEmail" name="newUserEmail" type="email" placeholder="admin@company.com" />
                    </div>
                    <div className="flex items-end col-span-2">
                      <Button type="submit" className="w-full">
                        Create User
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <p className="text-sm text-gray-600">Manage existing user roles and permissions</p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                              <Badge variant={
                                user.role === "superadmin" ? "destructive" : 
                                user.role === "admin" ? "default" : 
                                "secondary"
                              }>
                                {user.role}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              <div className="flex space-x-2">
                                {user.role !== "superadmin" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {/* Handle role change */}}
                                    >
                                      {user.role === "admin" ? "Make Employee" : "Make Admin"}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => {/* Handle delete */}}
                                    >
                                      Delete
                                    </Button>
                                  </>
                                )}
                                {user.role === "superadmin" && (
                                  <span className="text-xs text-gray-400">Protected</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Edit User: {editingUser.firstName} {editingUser.lastName}</h3>
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <Label htmlFor="editFirstName">First Name</Label>
                  <Input 
                    id="editFirstName"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="editLastName">Last Name</Label>
                  <Input 
                    id="editLastName"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                    required
                  />
                </div>
                {(editForm.role === 'admin' || editForm.role === 'superadmin') && (
                  <div>
                    <Label htmlFor="editEmail">Email</Label>
                    <Input 
                      id="editEmail"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      placeholder="admin@company.com"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="editRole">Role</Label>
                  <Select 
                    value={editForm.role}
                    onValueChange={(value) => setEditForm({...editForm, role: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      {editingUser.id === 'superadmin-001' && (
                        <SelectItem value="superadmin">Super Admin</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex space-x-2 pt-4">
                  <Button type="submit" className="flex-1">
                    Update User
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditingUser(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
