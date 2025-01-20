import { createClient } from '@supabase/supabase-js';
import { json } from '@sveltejs/kit';

const jwtSecret = import.meta.env.JWT_SECRET;

// I have 0 idea what I was tryna do here

export const GET = async (/** @type {{ url: any; locals: { supabase: any; }; }} */ event) => {

    const dbUrl = "https://pgqxivpgjzkikcxldpjv.supabase.co";

    console.log(dbUrl);
    console.log(jwtSecret);

    if (!dbUrl || !jwtSecret) {
        throw new Error('DATABASE_URL or JWT_SECRET is missing');
    }

    const supabase = createClient(dbUrl, jwtSecret);

    const { data: players, error: playersError } = await supabase
        .from('players')
        .select('*');

    if (playersError) {
        throw new Error(playersError.message);
    }

    console.log(players);

    const { data: guesses, error: guessesError } = await supabase
        .from('guesses')
        .select('*');

    if (guessesError) {
        throw new Error(guessesError.message);
    }

    console.log(guesses);

    return json({ players, guesses });
}