import { writable } from 'svelte/store';
import { supabase } from '../lib/client';
import type { Session } from '@supabase/supabase-js';

export const session = writable<Session | null>(null);
export const ready = writable<boolean | null>(null);

export async function fetchSession() {
	const { data, error } = await supabase.auth.getSession();
	const sessionData = data?.session;
	if (error) {
		ready.set(false);
		console.error('Error fetching session:', error.message);
		return;
	} else if (sessionData) {
		ready.set(true);
		session.set(sessionData);
		localStorage.setItem('supabase.auth.token', sessionData.access_token);
		localStorage.setItem('supabase.auth.expires_at', sessionData.refresh_token);
	} else {
		ready.set(false);
	}
	console.log(sessionData);
}
