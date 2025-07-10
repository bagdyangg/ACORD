import { z } from "zod";

// Password validation configuration
export const PASSWORD_CONFIG = {
  minLength: 8,
  requireTypes: 2, // латинские буквы и цифры
  maxAgeDays: 120,
} as const;

// Password validation schema
export const passwordSchema = z
  .string()
  .min(PASSWORD_CONFIG.minLength, `Password must be at least ${PASSWORD_CONFIG.minLength} characters long`)
  .refine((password) => {
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const types = [hasLetter, hasNumber].filter(Boolean).length;
    
    return types >= PASSWORD_CONFIG.requireTypes;
  }, "Password must contain at least 2 types of characters (letters and numbers)");

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Reset password schema (admin only)
export const resetPasswordSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  temporaryPassword: passwordSchema,
  mustChangePassword: z.boolean().default(true),
});

// Utility functions
export function isPasswordExpired(passwordChangedAt: Date, expiryDays: number): boolean {
  const now = new Date();
  const expiryDate = new Date(passwordChangedAt.getTime() + (expiryDays * 24 * 60 * 60 * 1000));
  return now > expiryDate;
}

export function getDaysUntilExpiry(passwordChangedAt: Date, expiryDays: number): number {
  const now = new Date();
  const expiryDate = new Date(passwordChangedAt.getTime() + (expiryDays * 24 * 60 * 60 * 1000));
  const diffTime = expiryDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function shouldShowExpiryWarning(passwordChangedAt: Date, expiryDays: number, warningDays: number): boolean {
  const daysUntilExpiry = getDaysUntilExpiry(passwordChangedAt, expiryDays);
  return daysUntilExpiry <= warningDays && daysUntilExpiry > 0;
}

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;