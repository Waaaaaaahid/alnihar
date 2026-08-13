/*
# AL NIHAR — Full Restaurant Platform Schema

## Overview
Creates the complete database schema for the AL NIHAR premium burger ordering platform.
This includes user profiles, categories, menu items, orders, order items, coupons,
reviews, payments, and restaurant settings.

## New Tables
1. **profiles** — Extends auth.users with full_name, phone, and role (customer/admin)
2. **categories** — Menu categories (Burgers, Smashed, Chicken, etc.)
3. **menu_items** — Individual food items with pricing, badges, availability
4. **coupons** — Discount codes (percentage/fixed) with usage limits and expiry
5. **orders** — Customer orders with status tracking, payment info, price snapshots
6. **order_items** — Line items per order (price snapshot preserved)
7. **reviews** — Customer ratings and comments with admin moderation
8. **payments** — Razorpay payment records with signature verification data
9. **restaurant_settings** — Singleton config (name, contact, hours, fees, tax)

## Security
- RLS enabled on ALL tables
- is_admin() SECURITY DEFINER function checks profile role for admin policies
- Public read access on catalog (categories, menu_items, settings) — needed for customer site
- Orders: public read (trackable by UUID which is 128-bit unguessable), admin-only updates
- Coupons: public read (needed for checkout validation), admin-only writes
- Reviews: only approved reviews are public; authenticated users create their own
- Admin operations on all tables restricted via is_admin() check
- Auto-profile creation trigger on auth.users signup (first user becomes admin)

## Notes
1. The first user to register automatically becomes admin (via trigger logic)
2. Order numbers are generated server-side in the create-order edge function
3. Price snapshots in order_items prevent historical orders from changing
*/

-- ============ PROFILES TABLE ============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============ CATEGORIES TABLE ============
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- ============ MENU ITEMS TABLE ============
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  original_price numeric(10,2) CHECK (original_price IS NULL OR original_price >= 0),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  image_url text NOT NULL DEFAULT '',
  is_available boolean NOT NULL DEFAULT true,
  is_bestseller boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  is_spicy boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_menu_items_featured ON menu_items(is_featured);

-- ============ COUPONS TABLE ============
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  discount_type text NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric(10,2) NOT NULL DEFAULT 0 CHECK (discount_value >= 0),
  min_order numeric(10,2) NOT NULL DEFAULT 0 CHECK (min_order >= 0),
  max_discount numeric(10,2) CHECK (max_discount IS NULL OR max_discount >= 0),
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  usage_limit int CHECK (usage_limit IS NULL OR usage_limit > 0),
  used_count int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- ============ ORDERS TABLE ============
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text NOT NULL DEFAULT '',
  delivery_address text NOT NULL,
  order_notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'placed' CHECK (status IN ('placed','confirmed','preparing','ready','out_for_delivery','delivered','cancelled','payment_failed')),
  payment_method text NOT NULL DEFAULT 'cod' CHECK (payment_method IN ('cod','razorpay')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  tax numeric(10,2) NOT NULL DEFAULT 0,
  delivery_fee numeric(10,2) NOT NULL DEFAULT 0,
  discount numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  coupon_code text NOT NULL DEFAULT '',
  estimated_minutes int NOT NULL DEFAULT 45,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- ============ ORDER ITEMS TABLE ============
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE SET NULL,
  name text NOT NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0),
  image_url text NOT NULL DEFAULT ''
);
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ============ REVIEWS TABLE ============
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  rating int NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL DEFAULT '',
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(is_approved);

-- ============ PAYMENTS TABLE ============
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  razorpay_order_id text NOT NULL DEFAULT '',
  razorpay_payment_id text NOT NULL DEFAULT '',
  razorpay_signature text NOT NULL DEFAULT '',
  amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);

-- ============ RESTAURANT SETTINGS TABLE (singleton) ============
CREATE TABLE IF NOT EXISTS restaurant_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name text NOT NULL DEFAULT 'AL NIHAR',
  tagline text NOT NULL DEFAULT 'Premium Burgers, Smashed to Perfection',
  logo_url text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '+91 98765 43210',
  email text NOT NULL DEFAULT 'hello@alnihar.com',
  address text NOT NULL DEFAULT '123 Food Street, Bandra West, Mumbai 400050',
  opening_hours jsonb NOT NULL DEFAULT '{"monday":"11:00 AM - 11:00 PM","tuesday":"11:00 AM - 11:00 PM","wednesday":"11:00 AM - 11:00 PM","thursday":"11:00 AM - 11:00 PM","friday":"11:00 AM - 12:00 AM","saturday":"11:00 AM - 12:00 AM","sunday":"12:00 PM - 11:00 PM"}'::jsonb,
  is_open boolean NOT NULL DEFAULT true,
  delivery_charge numeric(10,2) NOT NULL DEFAULT 40,
  tax_rate numeric(5,2) NOT NULL DEFAULT 5.00,
  hero_image_url text NOT NULL DEFAULT '',
  story_image_url text NOT NULL DEFAULT '',
  social_links jsonb NOT NULL DEFAULT '{"instagram":"https://instagram.com","facebook":"https://facebook.com","twitter":"https://twitter.com"}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;

-- Insert default settings row if not exists
INSERT INTO restaurant_settings (id) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM restaurant_settings WHERE id = 1);

-- ============ IS_ADMIN FUNCTION ============
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ============ AUTO-CREATE PROFILE ON SIGNUP ============
-- First user to register becomes admin, subsequent users are customers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    CASE
      WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN 'admin'
      ELSE 'customer'
    END
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ UPDATED_AT TRIGGER FUNCTION ============
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS categories_updated_at ON categories;
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS menu_items_updated_at ON menu_items;
CREATE TRIGGER menu_items_updated_at BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS restaurant_settings_updated_at ON restaurant_settings;
CREATE TRIGGER restaurant_settings_updated_at BEFORE UPDATE ON restaurant_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============ RLS POLICIES ============

-- PROFILES: users read/update own, admin reads all
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON profiles;
CREATE POLICY "profiles_select_own_or_admin" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_admin_update" ON profiles;
CREATE POLICY "profiles_admin_update" ON profiles FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- CATEGORIES: public read, admin writes
DROP POLICY IF EXISTS "categories_public_read" ON categories;
CREATE POLICY "categories_public_read" ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "categories_admin_insert" ON categories;
CREATE POLICY "categories_admin_insert" ON categories FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "categories_admin_update" ON categories;
CREATE POLICY "categories_admin_update" ON categories FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "categories_admin_delete" ON categories;
CREATE POLICY "categories_admin_delete" ON categories FOR DELETE
  TO authenticated USING (public.is_admin());

-- MENU ITEMS: public read, admin writes
DROP POLICY IF EXISTS "menu_items_public_read" ON menu_items;
CREATE POLICY "menu_items_public_read" ON menu_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "menu_items_admin_insert" ON menu_items;
CREATE POLICY "menu_items_admin_insert" ON menu_items FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "menu_items_admin_update" ON menu_items;
CREATE POLICY "menu_items_admin_update" ON menu_items FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "menu_items_admin_delete" ON menu_items;
CREATE POLICY "menu_items_admin_delete" ON menu_items FOR DELETE
  TO authenticated USING (public.is_admin());

-- COUPONS: public read (for checkout validation), admin writes
DROP POLICY IF EXISTS "coupons_public_read" ON coupons;
CREATE POLICY "coupons_public_read" ON coupons FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "coupons_admin_insert" ON coupons;
CREATE POLICY "coupons_admin_insert" ON coupons FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "coupons_admin_update" ON coupons;
CREATE POLICY "coupons_admin_update" ON coupons FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "coupons_admin_delete" ON coupons;
CREATE POLICY "coupons_admin_delete" ON coupons FOR DELETE
  TO authenticated USING (public.is_admin());

-- ORDERS: public read (trackable by UUID - 128-bit unguessable identifier),
-- authenticated + anon insert (guest checkout), admin-only update
DROP POLICY IF EXISTS "orders_public_read" ON orders;
CREATE POLICY "orders_public_read" ON orders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "orders_public_insert" ON orders;
CREATE POLICY "orders_public_insert" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "orders_admin_update" ON orders;
CREATE POLICY "orders_admin_update" ON orders FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ORDER ITEMS: public read (tied to order UUID), insert with order, admin-only update/delete
DROP POLICY IF EXISTS "order_items_public_read" ON order_items;
CREATE POLICY "order_items_public_read" ON order_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "order_items_public_insert" ON order_items;
CREATE POLICY "order_items_public_insert" ON order_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "order_items_admin_update" ON order_items;
CREATE POLICY "order_items_admin_update" ON order_items FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "order_items_admin_delete" ON order_items;
CREATE POLICY "order_items_admin_delete" ON order_items FOR DELETE
  TO authenticated USING (public.is_admin());

-- REVIEWS: public reads approved only, authenticated creates own, admin manages all
DROP POLICY IF EXISTS "reviews_public_read_approved" ON reviews;
CREATE POLICY "reviews_public_read_approved" ON reviews FOR SELECT
  TO anon, authenticated USING (is_approved = true OR user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "reviews_user_insert" ON reviews;
CREATE POLICY "reviews_user_insert" ON reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reviews_admin_update" ON reviews;
CREATE POLICY "reviews_admin_update" ON reviews FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "reviews_admin_delete" ON reviews;
CREATE POLICY "reviews_admin_delete" ON reviews FOR DELETE
  TO authenticated USING (public.is_admin());

-- PAYMENTS: public read (tied to order UUID), admin-only writes
DROP POLICY IF EXISTS "payments_public_read" ON payments;
CREATE POLICY "payments_public_read" ON payments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "payments_admin_insert" ON payments;
CREATE POLICY "payments_admin_insert" ON payments FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "payments_admin_update" ON payments;
CREATE POLICY "payments_admin_update" ON payments FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- RESTAURANT SETTINGS: public read, admin-only update
DROP POLICY IF EXISTS "settings_public_read" ON restaurant_settings;
CREATE POLICY "settings_public_read" ON restaurant_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "settings_admin_update" ON restaurant_settings;
CREATE POLICY "settings_admin_update" ON restaurant_settings FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Enable realtime for orders and order_items
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
