import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, UtensilsCrossed } from "lucide-react";
import type { Dish } from "@shared/schema";

interface OrderSummaryProps {
  selectedDishes: Dish[];
  onConfirm: () => void;
  isLoading: boolean;
  onRemoveDish: (dishId: number) => void;
}

export default function OrderSummary({ 
  selectedDishes, 
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
                {selectedDishes.length} {selectedDishes.length === 1 ? "dish" : "dishes"}
              </Badge>
            </div>
            
            <div className="space-y-3 mb-4 min-h-[60px]">
              {selectedDishes.length === 0 ? (
                <div className="text-gray-500 text-center py-4">
                  <UtensilsCrossed className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>Select dishes from the menu above</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {selectedDishes.map((dish, index) => (
                    <div key={dish.id} className="relative">
                      <img 
                        src={dish.imagePath || "https://images.unsplash.com/photo-1546554137-f86b9593a222?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=150"} 
                        alt="Selected dish" 
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-red-500 text-white rounded-full hover:bg-red-600"
                        onClick={() => onRemoveDish(dish.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <div className="text-xs text-center mt-1 text-gray-600">
                        #{index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="border-t pt-4">
              <Button 
                onClick={onConfirm}
                disabled={selectedDishes.length === 0 || isLoading}
                className="w-full bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isLoading ? "Confirming..." : `Confirm Order (${selectedDishes.length} dishes)`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
