import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xxvmpbjgvpxumdbvlufl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4dm1wYmpndnB4dW1kYnZsdWZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNDI3NDYsImV4cCI6MjA4NTgxODc0Nn0.danQ23xbtuNg-w_bvBWWuOed-9wjC3X55p7br_EWtfg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);