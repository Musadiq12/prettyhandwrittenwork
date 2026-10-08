CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE public.site_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  whatsapp_number text NOT NULL DEFAULT '91XXXXXXXXXX',
  upi_id text NOT NULL DEFAULT 'yourname@upi',
  offer_active boolean NOT NULL DEFAULT true,
  price_basic numeric NOT NULL DEFAULT 8,
  price_basic_offer numeric NOT NULL DEFAULT 6,
  price_cursive numeric NOT NULL DEFAULT 15,
  price_neat numeric NOT NULL DEFAULT 15,
  price_cover numeric NOT NULL DEFAULT 40,
  price_project_from numeric NOT NULL DEFAULT 250,
  pdf_addon_per_page numeric NOT NULL DEFAULT 1,
  shipping_min numeric NOT NULL DEFAULT 50,
  shipping_max numeric NOT NULL DEFAULT 100,
  bulk_discount_percent numeric NOT NULL DEFAULT 5,
  bulk_discount_threshold numeric NOT NULL DEFAULT 1500,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins update settings" ON public.site_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.site_settings (id) VALUES (1);

CREATE TYPE public.order_status AS ENUM ('new','confirmed','writing','ready','dispatched','delivered','cancelled');
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code text NOT NULL UNIQUE,
  name text NOT NULL,
  phone text NOT NULL,
  work_type text NOT NULL,
  writing_style text NOT NULL,
  pages int NOT NULL DEFAULT 0,
  covers int NOT NULL DEFAULT 0,
  delivery_type text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  pin text,
  deadline date,
  notes text,
  estimated_total numeric NOT NULL DEFAULT 0,
  status public.order_status NOT NULL DEFAULT 'new',
  admin_notes text,
  final_price numeric,
  advance_paid boolean NOT NULL DEFAULT false,
  tracking_info text,
  pdf_paths text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete orders" ON public.orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX orders_status_idx ON public.orders(status);
CREATE INDEX orders_created_idx ON public.orders(created_at DESC);
CREATE INDEX orders_deadline_idx ON public.orders(deadline);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER settings_touch BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.create_order(
  _name text, _phone text, _work_type text, _style text, _pages int, _covers int,
  _delivery text, _city text, _state text, _pin text, _deadline date, _notes text
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.site_settings; rate numeric; sub numeric; total numeric; code text;
BEGIN
  IF length(trim(_name)) NOT BETWEEN 2 AND 80 THEN RAISE EXCEPTION 'Invalid name'; END IF;
  IF _phone !~ '^[6-9][0-9]{9}$' THEN RAISE EXCEPTION 'Invalid phone'; END IF;
  IF length(_work_type) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Invalid work type'; END IF;
  IF _style NOT IN ('basic','cursive','beautiful') THEN RAISE EXCEPTION 'Invalid style'; END IF;
  IF _delivery NOT IN ('physical','pdf','both') THEN RAISE EXCEPTION 'Invalid delivery'; END IF;
  IF _pages < 1 OR _pages > 2000 OR _covers < 0 OR _covers > 100 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
  IF length(trim(_city)) NOT BETWEEN 2 AND 60 OR length(trim(_state)) NOT BETWEEN 2 AND 60 THEN RAISE EXCEPTION 'Invalid address'; END IF;
  IF _delivery <> 'pdf' AND (_pin IS NULL OR _pin !~ '^[1-9][0-9]{5}$') THEN RAISE EXCEPTION 'Invalid PIN'; END IF;
  IF length(coalesce(_notes,'')) > 1000 THEN RAISE EXCEPTION 'Notes too long'; END IF;

  SELECT * INTO s FROM public.site_settings WHERE id = 1;
  rate := CASE _style WHEN 'basic' THEN (CASE WHEN s.offer_active THEN s.price_basic_offer ELSE s.price_basic END)
                      WHEN 'cursive' THEN s.price_cursive ELSE s.price_neat END;
  sub := _pages * rate + _covers * s.price_cover + (CASE WHEN _delivery = 'both' THEN _pages * s.pdf_addon_per_page ELSE 0 END);
  total := sub - (CASE WHEN sub > s.bulk_discount_threshold THEN round(sub * s.bulk_discount_percent / 100) ELSE 0 END);

  LOOP
    code := 'PHW-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE order_code = code);
  END LOOP;

  INSERT INTO public.orders (order_code, name, phone, work_type, writing_style, pages, covers, delivery_type, city, state, pin, deadline, notes, estimated_total)
  VALUES (code, trim(_name), _phone, _work_type, _style, _pages, _covers, _delivery, trim(_city), trim(_state),
          CASE WHEN _delivery = 'pdf' THEN NULL ELSE _pin END, _deadline, nullif(trim(coalesce(_notes,'')), ''), total);
  RETURN code;
END $$;
REVOKE ALL ON FUNCTION public.create_order FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.lookup_order_pdfs(_code text, _phone text)
RETURNS text[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT pdf_paths FROM public.orders
  WHERE order_code = upper(trim(_code)) AND phone = trim(_phone) AND status <> 'cancelled'
$$;
REVOKE ALL ON FUNCTION public.lookup_order_pdfs FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_order_pdfs TO anon, authenticated;

CREATE POLICY "Admins manage order pdfs" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'order-pdfs' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'order-pdfs' AND public.has_role(auth.uid(), 'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;