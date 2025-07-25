import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, UtensilsCrossed } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Dish } from "@shared/schema";

interface OrderSummaryProps {
  selectedDishes: (Dish & { selectedQuantity?: number })[];
  onConfirm: () => void;
  isLoading: boolean;
  onRemoveDish: (dishId: number) => void;
  onDeleteOrder?: () => void;
  hasExistingOrder?: boolean;
  isDeleting?: boolean;
}

export default function OrderSummary({ 
  selectedDishes, 
  onConfirm, 
  isLoading, 
  onRemoveDish,
  onDeleteOrder,
  hasExistingOrder = false,
  isDeleting = false
}: OrderSummaryProps) {
  const isMobile = useIsMobile();
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg md:relative md:border-0 md:shadow-none md:bg-transparent safe-area-inset-bottom">
      <div className="max-w-7xl mx-auto">
        <Card className="border-0 md:border md:border-gray-100 rounded-none md:rounded-lg">
          <CardContent className="p-3 md:p-6">
            {/* Mobile Compact Header */}
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <h3 className="text-lg md:text-xl font-semibold text-secondary">Your Order</h3>
              <Badge variant="secondary" className="text-xs md:text-sm">
                {selectedDishes.reduce((total, dish) => total + (dish.selectedQuantity || 1), 0)} portions
              </Badge>
            </div>
            
            <div className="space-y-3 mb-4 min-h-[60px]">
              {selectedDishes.length === 0 ? (
                <div className="text-gray-500 text-center py-2 md:py-4">
                  <UtensilsCrossed className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm md:text-base">Select dishes from the menu above</p>
                </div>
              ) : (
                <div>
                  {isMobile ? (
                    /* Mobile: Compact horizontal scroll */
                    <div className="flex gap-1 overflow-x-auto py-1">
                      {selectedDishes.slice(0, 4).map((dish, index) => (
                        <div key={`mobile-${dish.id}-${index}`} className="relative flex-shrink-0">
                          {dish.imagePath && (
                            <img 
                              src={dish.imagePath} 
                              alt={`Selected dish ${index + 1}`}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-0 right-0 h-5 w-5 p-0 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md border border-white"
                            onClick={() => onRemoveDish(dish.id)}
                            aria-label={`Remove dish ${index + 1}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {selectedDishes.length > 4 && (
                        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded text-xs text-gray-600">
                          +{selectedDishes.length - 4}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Desktop: Grid layout */
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {selectedDishes.map((dish, index) => (
                        <div key={`desktop-${dish.id}-${index}`} className="relative">
                          {dish.imagePath && (
                            <img 
                              src={dish.imagePath} 
                              alt={`Selected dish ${index + 1}`}
                              className="w-full h-20 object-cover rounded-lg"
                            />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg border-2 border-white z-10"
                            onClick={() => onRemoveDish(dish.id)}
                            aria-label={`Remove dish ${index + 1}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <div className="text-xs text-center mt-1 text-gray-600">
                            {dish.selectedQuantity && dish.selectedQuantity !== 1 ? 
                              `${dish.selectedQuantity}x` : `#${index + 1}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="border-t pt-2 md:pt-4">
              {selectedDishes.length > 0 ? (
                <Button 
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="w-full bg-primary text-white py-2 md:py-3 px-4 md:px-6 rounded-lg font-semibold hover:bg-orange-600 transition-colors text-sm md:text-base"
                >
                  {isLoading ? "Confirming..." : `Confirm Order (${selectedDishes.reduce((total, dish) => total + (dish.selectedQuantity || 1), 0)} portions)`}
                </Button>
              ) : hasExistingOrder && onDeleteOrder ? (
                <Button 
                  onClick={onDeleteOrder}
                  disabled={isDeleting}
                  variant="destructive"
                  className="w-full py-2 md:py-3 px-4 md:px-6 rounded-lg font-semibold transition-colors text-sm md:text-base"
                >
                  {isDeleting ? "Deleting..." : "Delete My Order"}
                </Button>
              ) : (
                <Button 
                  disabled
                  className="w-full py-2 md:py-3 px-4 md:px-6 rounded-lg font-semibold bg-gray-300 cursor-not-allowed text-sm md:text-base"
                >
                  Select dishes to order
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
