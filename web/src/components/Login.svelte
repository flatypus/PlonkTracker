<script>
	import MdiDiscord from '~icons/mdi/discord';
	import { supabase } from '../lib/client';

	async function signInWithDiscord() {
		try {
			const { data, error } = await supabase.auth.signInWithOAuth({
				provider: 'discord',
				options: {
					redirectTo: process?.env?.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:5173/'
				}
			});

			if (error) {
				console.error('Error signing in:', error.message);
				return;
			}

			console.log('Sign-in successful:', data);
		} catch (err) {
			console.error('Unexpected error:', err);
		}
	}
</script>

<div class="flex w-1/2 min-w-[600px] flex-col gap-6 text-white">
	<h1 class="text-3xl">Welcome to PlonkTracker!</h1>
	<h2 class="text-lg">
		Please sign in; I'm storing thousands of data points for people with multiple devices, and I
		hope this is the simplest way I can help you keep track of it all.
	</h2>
	<h2 class="text-base text-slate-300">
		If you have suggestions for other sign-in methods, or other features in general, let me know at
		hinson (at) stanford (dot) edu
	</h2>
	<button
		onclick={signInWithDiscord}
		class="flex items-center justify-center gap-2 rounded-lg bg-[#7289da] px-6 py-3 text-white transition hover:scale-105"
	>
		<MdiDiscord class="h-6 w-6" />
		Sign in with Discord
	</button>
</div>
