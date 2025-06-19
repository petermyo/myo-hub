
import type { LucideIcon } from 'lucide-react';

export interface User {
  uid: string; // Changed from id to uid to match Firebase
  name: string;
  email: string;
  role: string; // Role ID or name, e.g., "Administrator", "Editor", "User"
  status: 'active' | 'inactive' | 'pending';
  lastLogin?: Date | string;
  createdAt: Date | string;
  avatarUrl?: string;
  enabledServices?: string[]; // Array of Service IDs
  subscriptionPlanId?: string;
  password?: string; // Optional: only for form validation, not stored directly
  confirmPassword?: string; // Optional: only for form validation
}

export interface Service {
  id: string; // Keep as id for service identification, not user id
  name: string;
  description: string;
  url: string;
  icon?: LucideIcon;
  category: 'Content' | 'Utility' | 'Storage' | 'Productivity';
}

export interface Role {
  id: string; // Role identifier, e.g., "admin", "editor", "user"
  name: string; // Display name, e.g., "Administrator"
  description: string;
  permissions: string[]; // e.g., ['service:content:read', 'admin:user:manage']
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: string; // e.g., "$10/month" or "Free"
  features: string[];
  servicesIncluded: string[]; // IDs of services
  highlight?: boolean; // To mark a plan as "popular" or "recommended"
}
