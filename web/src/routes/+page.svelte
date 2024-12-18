<script lang="ts">
	import { fetchSession, session, ready } from '../stores/sessionStore';
	import Dashboard from '../components/Dashboard.svelte';
	import Loading from '../components/Loading.svelte';
	import Login from '../components/Login.svelte';
	import { onMount } from 'svelte';

	onMount(() => {
		fetchSession();
	});
</script>

<main class="flex h-screen w-full flex-col items-center justify-center bg-slate-700">
	{#if $ready === null}
		<Loading />
	{:else if $ready}
		<Dashboard />
	{:else}
		<Login />
	{/if}
</main>
