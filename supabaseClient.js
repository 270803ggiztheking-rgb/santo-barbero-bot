const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || "https://rnlgcxoavkivtgpjgpbs.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJubGdjeG9hdmtpdnRncGpncGJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MzMxNDcsImV4cCI6MjA4MzMwOTE0N30.fHA-sIJbkF_0JH3O9YjeYK69MZ2K7LLJ50vaI1e2emU";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = { supabase };
