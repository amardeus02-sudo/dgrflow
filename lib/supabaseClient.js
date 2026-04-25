import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://supabase.com/dashboard/project/wwbvrhqeycokiojwzugg";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3YnZyaHFleWNva2lvand6dWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NTkzMjMsImV4cCI6MjA4OTQzNTMyM30.oOeX804nsZbggFhKmNMfappHtzOnwcnRYxqTlq75bVk";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
