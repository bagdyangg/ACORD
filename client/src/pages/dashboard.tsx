import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import DishCard from "@/components/dish-card";
import OrderSummary from "@/components/order-summary";
import type { Dish, Order } from "@shared/schema";

export default function Dashboard() {
  const [selectedDishes, setSelectedDishes] = useState<number[]>([]);
  const { toast } = useToast();
  
  const today = new Date().toISOString().split('T')[0];

  // Fetch dishes for today
  const { data: dishes = [], isLoading: dishesLoading } = useQuery<Dish[]>({
    queryKey: ["/api/dishes", { date: today }],
  });

  // Fetch user's existing orders for today
  const { data: existingOrders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders", { date: today }],
  });

  // Set selected dishes based on existing orders
  useEffect(() => {
    if (existingOrders.length > 0) {
      const orderDishIds = existingOrders.map(order => order.dishId);
      setSelectedDishes(orderDishIds);
    }
  }, [existingOrders]);

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
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
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

  return (
    <div className="min-h-screen bg-neutral">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-96 md:pb-8">
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
      </main>

      {/* Order Summary - Fixed on mobile */}
      <OrderSummary
        selectedDishes={selectedDishesData}
        onConfirm={confirmOrder}
        isLoading={orderMutation.isPending}
        onRemoveDish={(dishId) => setSelectedDishes(prev => prev.filter(id => id !== dishId))}
      />
    </div>
  );
}
