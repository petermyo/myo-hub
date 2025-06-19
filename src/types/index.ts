
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
  enabledServices?: string[]; // Array of Service IDs
  subscriptionPlanId?: string; // ID of the subscription plan
  password?: string; // Optional: only for form validation, not stored directly
  confirmPassword?: string; // Optional: only for form validation
}

export interface Service {
  id: string;
  name: string;
  description: string;
  url: string;
  icon?: LucideIcon;
  category: 'Content' | 'Utility' | 'Storage' | 'Productivity';
}

export interface Permission {
  id: string; // e.g., "user:create", "service:content-service:access"
  name: string; // e.g., "Create Users", "Access Content Service"
  description?: string;
  category: 'User Management' | 'Role Management' | 'Service Management' | 'Subscription Management' | 'Service Access' | 'Global';
}

export interface Role {
  id?: string; // Firestore document ID (optional before creation)
  name: string; // Display name, e.g., "Administrator", "Editor", "User"
  description: string;
  permissions: string[]; // Array of Permission IDs
}

export interface SubscriptionPlan {
  id?: string; // Firestore document ID
  name: string;
  description?: string;
  price: string; // e.g., "$10/month" or "Free"
  features: string[];
  servicesIncluded: string[]; // IDs of services (Service.id)
  permissionsGranted?: string[]; // Array of Permission IDs this plan grants
  highlight?: boolean; // To mark a plan as "popular" or "recommended"
}

