
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
  id: string; // e.g., "service:content:read", "admin:users:delete"
  name: string; // e.g., "Read Content Service", "Delete Users"
  description?: string;
}

export interface Role {
  id?: string; // Firestore document ID (optional before creation)
  name: string; // Display name, e.g., "Administrator", "Editor"
  description: string;
  permissions: string[]; // Array of Permission IDs, e.g., ['service:content:read', 'admin:users:manage']
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
