import type { LucideIcon } from 'lucide-react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string; // Role ID or name
  status: 'active' | 'inactive' | 'pending';
  lastLogin?: Date | string;
  createdAt: Date | string;
  avatarUrl?: string;
  enabledServices?: string[]; // Array of Service IDs
  subscriptionPlanId?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  url: string;
  icon?: LucideIcon;
  category: 'Content' | 'Utility' | 'Storage' | 'Productivity';
}

export interface Role {
  id: string;
  name: string;
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
