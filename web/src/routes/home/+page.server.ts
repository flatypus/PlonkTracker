import { createClient } from '@supabase/supabase-js';

const supabase_secret = import.meta.env.VITE_SUPABASE_SECRET;
const supabase = createClient("https://pgqxivpgjzkikcxldpjv.supabase.co", supabase_secret);

export async function load() {
    const { data, error } = await supabase.from('guesses').select('*');
    if (error) {
        console.error('Error fetching data:', error);
        return { props: { data: [] } };
    }
    console.log("Successfully fetched data! ")
    return { data };
}