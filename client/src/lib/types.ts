export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'member_individual' | 'member_organization' | 'member_organization_admin' | 'cafe_manager' | 'calmkaaj_team' | 'calmkaaj_admin';
  organization_id?: string;
  site: 'blue_area' | 'i_10';
  credits: number;
  used_credits: number;
  is_active: boolean;
  can_charge_cafe_to_org: boolean;
  can_charge_room_to_org: boolean;
  onboarding_completed: boolean;
  created_at?: string;
  // Profile information
  bio?: string;
  linkedin_url?: string;
  profile_image?: string;
  job_title?: string;
  company?: string;
  community_visible?: boolean;
  email_visible?: boolean;
}

export interface CartItem {
  id: number;
  name: string;
  price: string;
  quantity: number;
  image_url?: string;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: string;
  category_id?: number;
  image_url?: string;
  is_available: boolean;
  is_daily_special: boolean;
  site: string;
  created_at?: string;
}

export interface MenuCategory {
  id: number;
  name: string;
  description?: string;
  display_order?: number;
  is_active: boolean;
  site: string;
}

export interface MeetingRoom {
  id: number;
  name: string;
  description?: string;
  capacity: number;
  credit_cost_per_hour: number;
  amenities?: string[];
  image_url?: string;
  is_available: boolean;
  site: string;
  created_at?: string;
}

export interface CafeOrder {
  id: number;
  user_id: number;
  total_amount: string;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivered' | 'cancelled' | 'deleted';
  billed_to: 'personal' | 'organization';
  org_id?: string;
  handled_by?: number;
  created_by?: number;
  payment_status?: 'paid' | 'unpaid';
  payment_updated_by?: number;
  payment_updated_at?: string;
  notes?: string;
  delivery_location?: string;
  site: string;
  created_at: string;
  updated_at?: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  organization?: {
    id: string;
    name: string;
  };
  items?: Array<{
    id: number;
    quantity: number;
    price: string;
    menu_item: {
      id: number;
      name: string;
      description: string;
    };
  }>;
}

export interface MeetingBooking {
  id: number;
  user_id: number;
  room_id: number;
  start_time: string;
  end_time: string;
  credits_used: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  billed_to: 'personal' | 'organization';
  org_id?: string;
  notes?: string;
  site: string;
  created_at: string;
  updated_at?: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  room?: {
    id: number;
    name: string;
    capacity: number;
    amenities?: string[];
  };
  organization?: {
    id: string;
    name: string;
  };
}

export interface Announcement {
  id: number;
  title: string;
  body: string;
  image_url?: string;
  show_until?: string;
  is_active: boolean;
  site: string;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  site: string;
  created_at?: string;
}

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}
