"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

const { url, publishableKey } = getSupabasePublicConfig();

export const supabase = createBrowserClient<Database>(url, publishableKey);
