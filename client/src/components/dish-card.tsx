import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import type { Dish } from "@shared/schema";

interface DishCardProps {
  dish: Dish;
  isSelected: boolean;
  onToggle: () => void;
}

export default function DishCard({ dish, isSelected, onToggle }: DishCardProps) {
  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case "healthy":
        return "bg-green-100 text-green-800";
      case "popular":
        return "bg-orange-100 text-orange-800";
      case "vegan":
        return "bg-green-100 text-green-800";
      case "comfort":
        return "bg-purple-100 text-purple-800";
      case "premium":
        return "bg-blue-100 text-blue-800";
      case "classic":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const imageUrl = dish.imagePath || "https://images.unsplash.com/photo-1546554137-f86b9593a222?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400";

  return (
    <div 
      className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer relative ${
        isSelected ? "ring-2 ring-accent" : ""
      }`}
      onClick={onToggle}
    >
      <img 
        src={imageUrl} 
        alt={dish.name} 
        className="w-full h-48 object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = "https://images.unsplash.com/photo-1546554137-f86b9593a222?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400";
        }}
      />
      
      <div className="p-4">
        <h3 className="font-semibold text-lg text-secondary mb-2">{dish.name}</h3>
        {dish.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{dish.description}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-primary font-bold text-lg">
              ${parseFloat(dish.price.toString()).toFixed(2)}
            </span>
            {dish.category && (
              <Badge className={`text-xs font-medium ${getCategoryColor(dish.category)}`}>
                {dish.category}
              </Badge>
            )}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <i className="fas fa-users mr-1"></i>
            <span>{Math.floor(Math.random() * 10) + 1}</span>
          </div>
        </div>
      </div>
      
      {isSelected && (
        <div className="absolute top-4 right-4">
          <div className="bg-accent text-white rounded-full w-8 h-8 flex items-center justify-center">
            <Check className="h-4 w-4" />
          </div>
        </div>
      )}
    </div>
  );
}
