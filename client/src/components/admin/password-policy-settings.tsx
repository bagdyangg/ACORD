import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Settings, Shield, Save, RefreshCw } from "lucide-react";

interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAgeDays: number;
  preventReuse: number;
  warningDays: number;
}

export default function PasswordPolicySettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [policy, setPolicy] = useState<PasswordPolicy>({
    minLength: 8,
    requireUppercase: false,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    maxAgeDays: 120,
    preventReuse: 3,
    warningDays: 7,
  });

  const { data: currentPolicy } = useQuery<PasswordPolicy>({
    queryKey: ["/api/admin/password-policy"],
    enabled: true,
  });

  const updatePolicyMutation = useMutation({
    mutationFn: async (newPolicy: PasswordPolicy) => {
      const response = await fetch("/api/admin/password-policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPolicy),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update password policy");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password policy updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/password-policy"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update local state when current policy is loaded
  useEffect(() => {
    if (currentPolicy) {
      setPolicy(currentPolicy);
    }
  }, [currentPolicy]);

  const handleSave = () => {
    // Validate minimum requirements
    if (policy.minLength < 4) {
      toast({
        title: "Invalid Settings",
        description: "Minimum password length must be at least 4 characters",
        variant: "destructive",
      });
      return;
    }

    if (policy.maxAgeDays < 1 || policy.maxAgeDays > 365) {
      toast({
        title: "Invalid Settings", 
        description: "Password expiry must be between 1 and 365 days",
        variant: "destructive",
      });
      return;
    }

    if (policy.warningDays < 1 || policy.warningDays >= policy.maxAgeDays) {
      toast({
        title: "Invalid Settings",
        description: "Warning period must be between 1 day and less than expiry period",
        variant: "destructive",
      });
      return;
    }

    updatePolicyMutation.mutate(policy);
  };

  const resetToDefaults = () => {
    setPolicy({
      minLength: 8,
      requireUppercase: false,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      maxAgeDays: 120,
      preventReuse: 3,
      warningDays: 7,
    });
  };

  const getRequiredTypesCount = () => {
    const types = [
      policy.requireUppercase,
      policy.requireLowercase,
      policy.requireNumbers,
      policy.requireSpecialChars
    ];
    return types.filter(Boolean).length;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Password Policy Settings</span>
        </CardTitle>
        <CardDescription>
          Configure password requirements and security policies for all users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Policy Preview */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            Current Policy Summary
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Min length: <Badge variant="outline">{policy.minLength} chars</Badge></div>
            <div>Required types: <Badge variant="outline">{getRequiredTypesCount()}/4</Badge></div>
            <div>Max age: <Badge variant="outline">{policy.maxAgeDays} days</Badge></div>
            <div>Warning period: <Badge variant="outline">{policy.warningDays} days</Badge></div>
            <div>Prevent reuse: <Badge variant="outline">{policy.preventReuse} passwords</Badge></div>
          </div>
        </div>

        {/* Length Settings */}
        <div className="space-y-3">
          <Label htmlFor="minLength">Minimum Password Length</Label>
          <Input
            id="minLength"
            type="number"
            min="4"
            max="50"
            value={policy.minLength}
            onChange={(e) => setPolicy({ ...policy, minLength: parseInt(e.target.value) })}
          />
          <p className="text-xs text-gray-500">Recommended: 8-12 characters</p>
        </div>

        {/* Character Requirements */}
        <div className="space-y-3">
          <Label>Required Character Types</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requireUppercase"
                checked={policy.requireUppercase}
                onChange={(e) => setPolicy({ ...policy, requireUppercase: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="requireUppercase">Uppercase letters (A-Z)</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requireLowercase"
                checked={policy.requireLowercase}
                onChange={(e) => setPolicy({ ...policy, requireLowercase: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="requireLowercase">Lowercase letters (a-z)</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requireNumbers"
                checked={policy.requireNumbers}
                onChange={(e) => setPolicy({ ...policy, requireNumbers: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="requireNumbers">Numbers (0-9)</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requireSpecialChars"
                checked={policy.requireSpecialChars}
                onChange={(e) => setPolicy({ ...policy, requireSpecialChars: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="requireSpecialChars">Special characters (!@#$%^&*)</Label>
            </div>
          </div>
          {getRequiredTypesCount() < 2 && (
            <p className="text-xs text-amber-600">⚠️ Recommended: At least 2 character types</p>
          )}
        </div>

        {/* Expiry Settings */}
        <div className="space-y-3">
          <Label htmlFor="maxAgeDays">Password Expiry (Days)</Label>
          <Select
            value={policy.maxAgeDays.toString()}
            onValueChange={(value) => setPolicy({ ...policy, maxAgeDays: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="60">60 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
              <SelectItem value="120">120 days (default)</SelectItem>
              <SelectItem value="180">180 days</SelectItem>
              <SelectItem value="365">365 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Warning Period */}
        <div className="space-y-3">
          <Label htmlFor="warningDays">Expiry Warning Period (Days)</Label>
          <Select
            value={policy.warningDays.toString()}
            onValueChange={(value) => setPolicy({ ...policy, warningDays: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 day before</SelectItem>
              <SelectItem value="3">3 days before</SelectItem>
              <SelectItem value="7">7 days before (default)</SelectItem>
              <SelectItem value="14">14 days before</SelectItem>
              <SelectItem value="30">30 days before</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            Users will see warnings when their password expires in {policy.warningDays} days or less
          </p>
        </div>

        {/* Reuse Prevention */}
        <div className="space-y-3">
          <Label htmlFor="preventReuse">Prevent Password Reuse</Label>
          <Select
            value={policy.preventReuse.toString()}
            onValueChange={(value) => setPolicy({ ...policy, preventReuse: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">No restriction</SelectItem>
              <SelectItem value="3">Last 3 passwords</SelectItem>
              <SelectItem value="5">Last 5 passwords</SelectItem>
              <SelectItem value="10">Last 10 passwords</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={updatePolicyMutation.isPending}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            {updatePolicyMutation.isPending ? "Saving..." : "Save Policy"}
          </Button>
          
          <Button
            variant="outline"
            onClick={resetToDefaults}
            disabled={updatePolicyMutation.isPending}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Defaults
          </Button>
        </div>

        <div className="text-xs text-gray-500 pt-2">
          <p>⚠️ Changes apply to new passwords only. Existing passwords remain valid until expiry.</p>
        </div>
      </CardContent>
    </Card>
  );
}