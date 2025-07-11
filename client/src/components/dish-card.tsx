import { Check } from "lucide-react";
import { useState } from "react";
import type { Dish } from "@shared/schema";

interface DishCardProps {
  dish: Dish;
  selectedQuantity: number; // 0 = not selected, 0.5 = half portion, 1 = full portion, 2 = double portion
  onQuantityChange: (dishId: number, quantity: number) => void;
}

const PORTION_OPTIONS = [
  { value: 0.5, label: "1/2" },
  { value: 1, label: "1" },
  { value: 2, label: "2" }
];

export default function DishCard({ dish, selectedQuantity, onQuantityChange }: DishCardProps) {
  console.log("DishCard rendering with dish:", dish);
  console.log("Image path:", dish.imagePath);
  
  if (!dish.imagePath) {
    console.log("No image path, not rendering");
    return null; // Don't render if no image
  }

  const handlePortionClick = (e: React.MouseEvent, quantity: number) => {
    e.stopPropagation(); // Prevent image click
    const newQuantity = selectedQuantity === quantity ? 0 : quantity;
    onQuantityChange(dish.id, newQuantity);
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden relative touch-manipulation">
      {/* Dish Image - no click handler */}
      <img 
        src={dish.imagePath} 
        alt="Dish" 
        className="w-full h-48 sm:h-64 object-cover"
      />
      
      {/* Portion Selection Checkboxes */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        {PORTION_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={(e) => handlePortionClick(e, option.value)}
            className={`w-12 h-12 rounded-full font-bold text-sm border-2 transition-all duration-200 ${
              selectedQuantity === option.value
                ? "bg-accent text-white border-accent shadow-lg scale-110"
                : "bg-white/90 text-gray-700 border-gray-300 hover:border-accent hover:bg-accent/10"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      
      {/* Selected indicator */}
      {selectedQuantity > 0 && (
        <div className="absolute top-4 right-4">
          <div className="bg-accent text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
            <Check className="h-4 w-4" />
          </div>
        </div>
      )}
      
      {/* Dish info overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
        <p className="text-white text-sm">
          Uploaded: {new Date(dish.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
