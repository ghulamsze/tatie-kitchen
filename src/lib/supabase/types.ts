export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MemberRole = 'owner' | 'device';
export type MenuCategory = 'makanan' | 'mie' | 'snack' | 'minuman';

export interface Shop {
  id: string;
  name: string;
  timezone: string;
  queue_reset_time?: string;
  created_at: string;
}

export interface ShopMember {
  shop_id: string;
  user_id: string;
  role: MemberRole;
  created_at: string;
}

export interface Cashier {
  id: string;
  shop_id: string;
  name: string;
  active: boolean;
  created_at: string;
}

export interface MenuGroup {
  id: string;
  shop_id: string;
  category: MenuCategory;
  name: string;
  icon_key: string;
  sort: number;
}

export interface MenuItem {
  id: string;
  shop_id: string;
  group_id: string;
  name: string;
  price_idr: number;
  available: boolean;
  photo_path: string | null;
  sort: number;
  active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  shop_id: string;
  cashier_id: string;
  device_id: string | null;
  table_no: string;
  total_idr: number;
  cash_received_idr: number;
  change_idr: number;
  status: string;
  queue_no?: number | null;
  business_date?: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name_snapshot: string;
  price_snapshot_idr: number;
  qty: number;
}

export interface Device {
  id: string;
  shop_id: string;
  name: string | null;
  platform: string | null;
  form_factor: string | null;
  user_agent: string | null;
  last_seen_at: string;
}

export interface BestSeller {
  menu_item_id: string;
  qty: number;
}

export interface CreateOrderItemInput {
  menu_item_id: string;
  qty: number;
}

export interface CreateOrderPayload {
  id: string;
  shop_id: string;
  cashier_id: string;
  device_id?: string | null;
  table_no: string;
  cash_received_idr: number;
  items: CreateOrderItemInput[];
}

export interface Database {
  public: {
    Tables: {
      shops: {
        Row: Shop;
        Insert: Partial<Shop> & { name: string };
        Update: Partial<Shop>;
      };
      shop_members: {
        Row: ShopMember;
        Insert: ShopMember;
        Update: Partial<ShopMember>;
      };
      cashiers: {
        Row: Cashier;
        Insert: Partial<Cashier> & { shop_id: string; name: string };
        Update: Partial<Cashier>;
      };
      menu_groups: {
        Row: MenuGroup;
        Insert: Partial<MenuGroup> & { shop_id: string; category: MenuCategory; name: string; icon_key: string };
        Update: Partial<MenuGroup>;
      };
      menu_items: {
        Row: MenuItem;
        Insert: Partial<MenuItem> & { shop_id: string; group_id: string; name: string; price_idr: number };
        Update: Partial<MenuItem>;
      };
      orders: {
        Row: Order;
        Insert: Order;
        Update: Partial<Order>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Partial<OrderItem> & { order_id: string; name_snapshot: string; price_snapshot_idr: number; qty: number };
        Update: Partial<OrderItem>;
      };
      devices: {
        Row: Device;
        Insert: Partial<Device> & { shop_id: string };
        Update: Partial<Device>;
      };
    };
    Views: {
      best_sellers: {
        Row: BestSeller;
      };
    };
    Functions: {
      is_member: {
        Args: { p_shop_id: string };
        Returns: boolean;
      };
      is_owner: {
        Args: { p_shop_id: string };
        Returns: boolean;
      };
      set_item_availability: {
        Args: { p_item_id: string; p_available: boolean };
        Returns: void;
      };
      add_cashier: {
        Args: { p_shop_id: string; p_name: string };
        Returns: Cashier;
      };
      create_order: {
        Args: { p_order: Json };
        Returns: Order;
      };
    };
  };
}
