import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Testimonial = Database["public"]["Tables"]["testimonials"]["Row"];

export const testimonialsQuery = queryOptions({
  queryKey: ["admin-testimonials"],
  queryFn: async (): Promise<Testimonial[]> => {
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const publishedTestimonialsQuery = queryOptions({
  queryKey: ["published-testimonials"],
  queryFn: async (): Promise<Testimonial[]> => {
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) {
      // Keep the public homepage usable if the optional testimonial table has not
      // been provisioned yet; the admin page still surfaces configuration errors.
      console.error("Unable to load published testimonials", error);
      return [];
    }
    return data;
  },
  staleTime: 60_000,
});
