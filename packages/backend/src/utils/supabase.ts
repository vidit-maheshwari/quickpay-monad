import { createClient } from "@supabase/supabase-js";
import {configDotenv} from 'dotenv'
configDotenv()

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

console.log("[supabase] SUPABASE_URL present:", Boolean(supabaseUrl));
console.log("[supabase] SUPABASE_KEY present:", Boolean(supabaseKey));

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_KEY environment variables"
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

export const getSupabase = () => supabase;
