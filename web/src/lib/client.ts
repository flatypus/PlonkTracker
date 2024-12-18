import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pgqxivpgjzkikcxldpjv.supabase.co';
const SUPABASE_ANON_KEY =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncXhpdnBnanpraWtjeGxkcGp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzNDAwNjcsImV4cCI6MjA0OTkxNjA2N30.0F2C6kQh3Wz-MXzD63Jty4ow7F_ZnoDfQOtJIGqZAnw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
