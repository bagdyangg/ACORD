import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, UtensilsCrossed } from "lucide-react";
import type { Dish } from "@shared/schema";

interface OrderSummaryProps {
  selectedDishes: Dish[];
  totalPrice: number;
  onConfirm: () => void;
  isLoading: boolean;
  onRemoveDish: (dishId: number) => void;
}

export default function OrderSummary({ 
  selectedDishes, 
  totalPrice, 
  onConfirm, 
  isLoading, 
  onRemoveDish 
}: OrderSummaryProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg md:relative md:border-0 md:shadow-none md:bg-transparent md:p-0">
      <div className="max-w-7xl mx-auto">
        <Card className="border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-secondary">Your Order</h3>
              <Badge variant="secondary">
                {selectedDishes.length} {selectedDishes.length === 1 ? "item" : "items"}
              </Badge>
            </div>
            
            <div className="space-y-3 mb-4 min-h-[60px]">
              {selectedDishes.length === 0 ? (
                <div className="text-gray-500 text-center py-4">
                  <UtensilsCrossed className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>Select dishes to add to your order</p>
                </div>
              ) : (
                selectedDishes.map((dish) => (
                  <div key={dish.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">{dish.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-primary">
                        ${parseFloat(dish.price.toString()).toFixed(2)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                        onClick={() => onRemoveDish(dish.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold text-secondary">Total:</span>
                <span className="text-2xl font-bold text-primary">${totalPrice.toFixed(2)}</span>
              </div>
              <Button 
                onClick={onConfirm}
                disabled={selectedDishes.length === 0 || isLoading}
                className="w-full bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isLoading ? "Confirming..." : "Confirm Order"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
