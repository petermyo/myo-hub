
import type { LucideIcon } from 'lucide-react';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: string; // Role name, e.g., "Administrator", "Editor", "User"
  status: 'active' | 'inactive' | 'pending';
  lastLogin?: Date | string;
  createdAt: Date | string;
  avatarUrl?: string;
  enabledServices?: string[]; // Array of Service slugs (Service.slug)
  subscriptionPlanId?: string; // ID of the subscription plan (SubscriptionPlan.id - Firestore ID)
  password?: string; // Optional: only for form validation, not stored directly
  confirmPassword?: string; // Optional: only for form validation
}

export interface Service {
  slug: string; // Unique identifier, will also be Firestore document ID
  name: string;
  description: string;
  icon: string; // Name of the LucideIcon
  url: string; // Domain address
  linkedSubscriptionIds?: string[]; // Array of SubscriptionPlan Firestore document IDs
  // category field removed to simplify, can be added back if needed
}

export interface Permission {
  id: string; // e.g., "user:create", "service:content-service:access"
  name: string; // e.g., "Create Users", "Access Content Service"
  description?: string;
  category: 'User Management' | 'Role Management' | 'Service Configuration' | 'Subscription Management' | 'Service Access' | 'Global';
}

export interface Role {
  id?: string; // Firestore document ID (optional before creation)
  name: string; // Display name, e.g., "Administrator", "Editor", "User"
  name_lowercase?: string; // For case-insensitive checks
  description: string;
  permissions: string[]; // Array of Permission IDs
}

export interface SubscriptionPlan {
  id?: string; // Firestore document ID (auto-generated)
  name: string;
  slug: string; // Unique, user-defined slug
  description?: string;
  duration: 'Monthly' | 'Unlimited';
  points: number; // 0 for unlimited
  storageLimitMB: number; // 0 for unlimited
  price: string; // e.g., "Free", "$10/month"
  // servicesIncluded: string[]; // Array of Service slugs - Removed for now, linking handled by Service.linkedSubscriptionIds
  features?: string[]; // Optional: list of features
  highlight?: boolean; // To mark a plan as "popular" or "recommended"
}
