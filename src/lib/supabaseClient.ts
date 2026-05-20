"use client";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://kaoybbpezkkmufzhxru.supabase.co";
const supabaseAnonKey = "sb_publishable_xwHeAklBZamxMUHWzPytHw_s4A7COgp";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
