<script>
	import { supabase } from '../lib/client';
	import { session } from '../stores/sessionStore';

	async function signOut() {
		try {
			const { error } = await supabase.auth.signOut();
			if (error) {
				console.error('Error signing out:', error.message);
				return;
			}
			console.log('Sign-out successful:');
			location.reload();
		} catch (err) {
			console.error('Unexpected error:', err);
		}
	}
</script>

<div class="flex w-1/2 min-w-[600px] flex-col gap-6 text-white">
	<h1 class="text-3xl">Welcome to PlonkTracker!</h1>
	<b>
		<a
			href="https://github.com/flatypus/PlonkTracker/raw/refs/heads/master/PlonkTracker.user.js"
			class="text-blue-400 underline"
		>
			Click to install the script!
		</a>
	</b>
	<h2 class="text-base text-slate-300">
		If you have suggestions for other sign-in methods, or other features in general, let me know at
		hinson (at) stanford (dot) edu
	</h2>

	<b>
		The below indicator will show if the script is working or not. Make sure you've enabled it in
		Tampermonkey!
	</b>
	<h1>
		Tracking: <span id="PLONKTRACKER_TRACKING_ID" style="color: red;">NOT TRACKING</span>
	</h1>
	<a href="home">Go Home</a>

	<div class="absolute bottom-4 right-4 flex flex-row gap-2">
		<img
			alt="pfp"
			class="aspect-square h-[40px] w-[40px] rounded-full bg-[#7289da] p-[2px] text-white transition hover:scale-105"
			src={$session ? $session.user.user_metadata.picture : ''}
		/>
		<button
			onclick={signOut}
			class="rounded-lg bg-[#7289da] px-6 py-2 text-white transition hover:scale-105"
		>
			Sign out
		</button>
	</div>
</div>
