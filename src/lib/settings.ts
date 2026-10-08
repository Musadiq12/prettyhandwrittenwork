import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/config";

export const settingsQuery = queryOptions({
  queryKey: ["site-settings"],
  queryFn: async (): Promise<SiteSettings> => {
    try {
      const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
      if (error || !data) return DEFAULT_SETTINGS;
      const out = { ...DEFAULT_SETTINGS };
      for (const k of Object.keys(DEFAULT_SETTINGS) as (keyof SiteSettings)[]) {
        const v = (data as Record<string, unknown>)[k];
        if (v !== null && v !== undefined) (out as Record<string, unknown>)[k] = typeof DEFAULT_SETTINGS[k] === "number" ? Number(v) : v;
      }
      return out;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },
  staleTime: 60_000,
});

export function useSiteSettings(): SiteSettings {
  const { data } = useQuery({ ...settingsQuery, placeholderData: DEFAULT_SETTINGS });
  return data ?? DEFAULT_SETTINGS;
}

export const basicRateOf = (s: SiteSettings) => (s.offer_active ? s.price_basic_offer : s.price_basic);

export const STYLE_LABELS = { basic: "Basic Running", cursive: "Cursive", beautiful: "Beautiful & Neat" } as const;
export const DELIVERY_LABELS = { physical: "Physical Delivery", pdf: "PDF Only", both: "Physical + PDF" } as const;
export type StyleKey = keyof typeof STYLE_LABELS;
export type DeliveryKey = keyof typeof DELIVERY_LABELS;

export const rateFor = (s: SiteSettings, style: StyleKey) =>
  style === "basic" ? basicRateOf(s) : style === "cursive" ? s.price_cursive : s.price_neat;
