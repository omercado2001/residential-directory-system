export interface Category {
  id: string;
  slug: string;
  name: string;
  color?: string;
  icon: string;
  created_at?: string;
}

export interface Business {
  id: string;
  name: string;
  category_id: string;
  tags?: string | null;
  rating?: number;
  reviews?: number;
  distance?: number;
  hours?: string | null;
  is_open?: boolean;
  phone?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  description?: string | null;
  image?: string | null;
  logo?: string | null;
  gallery?: string[];
  featured?: boolean;
  lat?: number | null;
  lng?: number | null;
  created_at?: string;
}

export interface MenuItem {
  id: string;
  business_id: string;
  category: string;
  name: string;
  description?: string | null;
  price: number;
  image?: string | null;
  created_at?: string;
}

export interface Promotion {
  id: string;
  business_id: string;
  category_id: string;
  title: string;
  description?: string | null;
  badge?: string | null;
  badge_color?: string;
  valid_until?: string | null;
  image?: string | null;
  ribbon?: string | null;
  created_at?: string;
}

export interface CommunityEvent {
  id: string;
  title: string;
  category?: string | null;
  location?: string | null;
  event_date?: string | null;
  description?: string | null;
  organizer_phone?: string | null;
  whatsapp?: string | null;
  image?: string | null;
  created_at?: string;
}

export interface UserFavorite {
  user_id: string;
  business_id: string;
  created_at?: string;
}

export interface Profile {
  id: string;
  email?: string | null;
  full_name?: string | null;
  role?: string;
  avatar_url?: string | null;
  created_at?: string;
}

export interface AppLog {
  id: string;
  user_id?: string | null;
  error_message: string;
  stack_trace?: string | null;
  component_stack?: string | null;
  platform?: string;
  extra_info?: string | null;
  created_at?: string;
}

export interface SystemUser {
  id: string;
  username: string;
  email: string;
  password?: string;
  full_name: string;
  role: string;
  avatar_url?: string | null;
  created_at?: string;
}

export interface AppAnalyticsEvent {
  id: string;
  event_type: 'query' | 'search' | 'view_business' | 'view_category' | 'whatsapp_click' | 'phone_click';
  entity_type?: 'business' | 'category' | 'menu_item' | 'promotion' | 'event' | null;
  entity_id?: string | null;
  search_query?: string | null;
  platform: 'android' | 'ios' | 'mobile';
  user_id?: string | null;
  created_at?: string;
}

export type TableName =
  | 'categories'
  | 'businesses'
  | 'menu_items'
  | 'promotions'
  | 'events'
  | 'user_favorites'
  | 'profiles'
  | 'system_users'
  | 'app_logs'
  | 'app_analytics';
