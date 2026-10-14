-- Increase new order-code entropy while preserving all existing order records.
-- New codes use 16 random hexadecimal characters after the PHW- prefix.
CREATE OR REPLACE FUNCTION public.create_order(
  _name text,
  _phone text,
  _work_type text,
  _style text,
  _pages integer,
  _covers integer,
  _delivery text,
  _city text,
  _state text,
  _pin text,
  _deadline date,
  _notes text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s public.site_settings;
  rate numeric;
  sub numeric;
  total numeric;
  code text;
BEGIN
  IF _name IS NULL OR length(trim(_name)) NOT BETWEEN 2 AND 80 THEN RAISE EXCEPTION 'Invalid name'; END IF;
  IF _phone IS NULL OR _phone !~ '^[6-9][0-9]{9}$' THEN RAISE EXCEPTION 'Invalid phone'; END IF;
  IF _work_type IS NULL OR length(_work_type) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Invalid work type'; END IF;
  IF _style IS NULL OR _style NOT IN ('basic','cursive','beautiful') THEN RAISE EXCEPTION 'Invalid style'; END IF;
  IF _delivery IS NULL OR _delivery NOT IN ('physical','pdf','both') THEN RAISE EXCEPTION 'Invalid delivery'; END IF;
  IF _pages IS NULL OR _covers IS NULL OR _pages < 1 OR _pages > 2000 OR _covers < 0 OR _covers > 100 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
  IF length(coalesce(_city,'')) > 60 OR length(coalesce(_state,'')) > 60 THEN RAISE EXCEPTION 'Invalid address'; END IF;
  IF _delivery <> 'pdf' AND (length(trim(coalesce(_city,''))) < 2 OR length(trim(coalesce(_state,''))) < 2) THEN RAISE EXCEPTION 'Invalid address'; END IF;
  IF _delivery <> 'pdf' AND (_pin IS NULL OR _pin !~ '^[1-9][0-9]{5}$') THEN RAISE EXCEPTION 'Invalid PIN'; END IF;
  IF _deadline IS NULL THEN RAISE EXCEPTION 'Invalid deadline'; END IF;
  IF length(coalesce(_notes,'')) > 1000 THEN RAISE EXCEPTION 'Notes too long'; END IF;

  SELECT * INTO s FROM public.site_settings WHERE id = 1;
  rate := CASE _style
    WHEN 'basic' THEN (CASE WHEN s.offer_active THEN s.price_basic_offer ELSE s.price_basic END)
    WHEN 'cursive' THEN s.price_cursive
    ELSE s.price_neat
  END;
  sub := _pages * rate + _covers * s.price_cover
    + (CASE WHEN _delivery = 'both' THEN _pages * s.pdf_addon_per_page ELSE 0 END);
  total := sub - (CASE WHEN sub > s.bulk_discount_threshold THEN round(sub * s.bulk_discount_percent / 100) ELSE 0 END);

  LOOP
    code := 'PHW-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE order_code = code);
  END LOOP;

  INSERT INTO public.orders (
    order_code, name, phone, work_type, writing_style, pages, covers,
    delivery_type, city, state, pin, deadline, notes, estimated_total
  )
  VALUES (
    code, trim(_name), _phone, _work_type, _style, _pages, _covers,
    _delivery,
    CASE WHEN _delivery = 'pdf' THEN '' ELSE trim(_city) END,
    CASE WHEN _delivery = 'pdf' THEN '' ELSE trim(_state) END,
    CASE WHEN _delivery = 'pdf' THEN NULL ELSE _pin END,
    _deadline, nullif(trim(coalesce(_notes,'')), ''), total
  );

  RETURN code;
END;
$$;

REVOKE ALL ON FUNCTION public.create_order(text, text, text, text, integer, integer, text, text, text, text, date, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order(text, text, text, text, integer, integer, text, text, text, text, date, text) TO anon, authenticated;
