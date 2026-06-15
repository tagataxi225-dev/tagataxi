export interface Restaurant {
  id: string;
  user_id?: string;
  restaurant_name: string;
  cuisine_types?: string[];
  logo_url?: string;
  banner_url?: string;
  description?: string;
  rating_average?: number;
  rating_count?: number;
  average_preparation_time?: number;
  minimum_order_amount?: number;
  delivery_available?: boolean;
  takeaway_available?: boolean;
  is_active: boolean;
  verification_status: string;
  city: string;
  phone_number?: string;
  address: string;
  updated_at?: string;
}

export interface FoodProduct {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  price: number;
  main_image_url?: string;
  category: string;
  is_available?: boolean;
  moderation_status: string;
  video_url?: string;
}

export interface FoodCartItem extends FoodProduct {
  quantity: number;
  notes?: string;
  restaurant_name?: string;
}
