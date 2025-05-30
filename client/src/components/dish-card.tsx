import { Check } from "lucide-react";
import type { Dish } from "@shared/schema";

interface DishCardProps {
  dish: Dish;
  isSelected: boolean;
  onToggle: () => void;
}

export default function DishCard({ dish, isSelected, onToggle }: DishCardProps) {
  if (!dish.imagePath) {
    return null; // Don't render if no image
  }

  return (
    <div 
      className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer relative ${
        isSelected ? "ring-4 ring-accent" : ""
      }`}
      onClick={onToggle}
    >
      <img 
        src={dish.imagePath} 
        alt="Dish" 
        className="w-full h-64 object-cover"
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
