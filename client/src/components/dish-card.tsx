import { Check } from "lucide-react";
import type { Dish } from "@shared/schema";

interface DishCardProps {
  dish: Dish;
  isSelected: boolean;
  onToggle: () => void;
}

export default function DishCard({ dish, isSelected, onToggle }: DishCardProps) {
  const imageUrl = dish.imagePath || "https://images.unsplash.com/photo-1546554137-f86b9593a222?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400";

  return (
    <div 
      className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer relative ${
        isSelected ? "ring-4 ring-accent" : ""
      }`}
      onClick={onToggle}
    >
      <img 
        src={imageUrl} 
        alt="Dish" 
        className="w-full h-64 object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = "https://images.unsplash.com/photo-1546554137-f86b9593a222?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400";
        }}
      />
      
      {isSelected && (
        <div className="absolute top-4 right-4">
          <div className="bg-accent text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg">
            <Check className="h-6 w-6" />
          </div>
        </div>
      )}
    </div>
  );
}
