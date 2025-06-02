import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      // Load theme preference per user
      const userThemeKey = `theme_${user.id}`;
      const savedTheme = localStorage.getItem(userThemeKey);
      const prefersDark = savedTheme === 'dark' || 
        (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      setIsDark(prefersDark);
      updateTheme(prefersDark);
    }
  }, [user?.id]);

  const updateTheme = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      document.body.style.backgroundColor = '#1f2937'; // Темно-серый вместо черного
      document.body.style.color = '#f3f4f6';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    }
  };

  const toggleTheme = () => {
    if (!user?.id) return;
    
    const newTheme = !isDark;
    setIsDark(newTheme);
    updateTheme(newTheme);
    
    // Save theme preference per user
    const userThemeKey = `theme_${user.id}`;
    localStorage.setItem(userThemeKey, newTheme ? 'dark' : 'light');
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="p-2"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}