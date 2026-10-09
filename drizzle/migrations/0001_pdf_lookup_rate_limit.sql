-- Protect customer PDF lookup from automated order-code guessing.
-- Apply this migration to the Supabase project before deploying the application change.

CREATE TABLE IF NOT EXISTS public.pdf_lookup_rate_limits (
  key_hash text PRIMARY KEY CHECK (key_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz NOT NULL,
  attempts integer NOT NULL CHECK (attempts >= 0)
);

ALTER TABLE public.pdf_lookup_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS pdf_lookup_rate_limits_window_idx ON public.pdf_lookup_rate_limits (window_started_at);
REVOKE ALL ON TABLE public.pdf_lookup_rate_limits FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.consume_pdf_lookup_rate_limit(_key_hash text)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_attempts integer;
BEGIN
  IF _key_hash IS NULL OR _key_hash !~ '^[0-9a-f]{64} public.pdf_lookup_rate_limits (key_hash, window_started_at, attempts)
  VALUES (_key_hash, v_now, 1)
  ON CONFLICT (key_hash) DO UPDATE
  SET
    window_started_at = CASE
      WHEN public.pdf_lookup_rate_limits.window_started_at <= v_now - interval '15 minutes'
        THEN v_now
      ELSE public.pdf_lookup_rate_limits.window_started_at
    END,
    attempts = CASE
      WHEN public.pdf_lookup_rate_limits.window_started_at <= v_now - interval '15 minutes'
        THEN 1
      ELSE LEAST(public.pdf_lookup_rate_limits.attempts + 1, 11)
    END
  RETURNING attempts INTO v_attempts;

  RETURN v_attempts <= 10;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_pdf_lookup_rate_limit(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_pdf_lookup_rate_limit(text) TO service_role;

-- Prevent direct anonymous RPC calls that would bypass the server-side limiter.
REVOKE ALL ON FUNCTION public.lookup_order_pdfs(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_order_pdfs(text, text) TO service_role;
 THEN
    RETURN false;
  END IF;

  -- Bound table growth from transient IP addresses while retaining recent windows.
  DELETE FROM public.pdf_lookup_rate_limits
  WHERE window_started_at < v_now - interval '24 hours';

  INSERT INTO public.pdf_lookup_rate_limits (key_hash, window_started_at, attempts)
  VALUES (_key_hash, v_now, 1)
  ON CONFLICT (key_hash) DO UPDATE
  SET
    window_started_at = CASE
      WHEN public.pdf_lookup_rate_limits.window_started_at <= v_now - interval '15 minutes'
        THEN v_now
      ELSE public.pdf_lookup_rate_limits.window_started_at
    END,
    attempts = CASE
      WHEN public.pdf_lookup_rate_limits.window_started_at <= v_now - interval '15 minutes'
        THEN 1
      ELSE LEAST(public.pdf_lookup_rate_limits.attempts + 1, 11)
    END
  RETURNING attempts INTO v_attempts;

  RETURN v_attempts <= 10;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_pdf_lookup_rate_limit(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_pdf_lookup_rate_limit(text) TO service_role;

-- Prevent direct anonymous RPC calls that would bypass the server-side limiter.
REVOKE ALL ON FUNCTION public.lookup_order_pdfs(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_order_pdfs(text, text) TO service_role;
