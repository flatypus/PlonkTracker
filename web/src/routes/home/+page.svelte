<script lang="ts">
	import { onMount } from 'svelte';
	import * as mapboxgl from 'mapbox-gl';
	import { createClient } from '@supabase/supabase-js';

	const mapboxToken = import.meta.env.VITE_MAPBOX_KEY;
	const supabaseKey = import.meta.env.VITE_JWT_SECRET;
	const supabaseUrl = import.meta.env.VITE_DATABASE_URL;

	let mapContainer: HTMLElement;

	onMount(() => {
		if (!mapboxToken) {
			console.error(
				'Mapbox token is missing. Please set VITE_MAPBOX_KEY in your environment variables.'
			);
			return;
		}

		// Initialize the map
		const map = new mapboxgl.Map({
			container: mapContainer,
			style: 'mapbox://styles/mapbox/streets-v9',
			projection: 'globe',
			accessToken: mapboxToken,
			zoom: 1,
			center: [30, 15]
		});

		map.addControl(new mapboxgl.NavigationControl());
		map.scrollZoom.disable();

		map.on('style.load', () => {
			map.setFog({});
		});

		let userInteracting = false;
		const spinEnabled = true;

		function spinGlobe() {
			const secondsPerRevolution = 240;
			const maxSpinZoom = 5;
			const slowSpinZoom = 3;

			const zoom = map.getZoom();
			if (spinEnabled && !userInteracting && zoom < maxSpinZoom) {
				let distancePerSecond = 360 / secondsPerRevolution;
				if (zoom > slowSpinZoom) {
					const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
					distancePerSecond *= zoomDif;
				}
				const center = map.getCenter();
				center.lng -= distancePerSecond;
				map.easeTo({ center, duration: 1000, easing: (n) => n });
			}
		}

		// Pause spinning on interaction
		map.on('mousedown', () => {
			userInteracting = true;
		});
		map.on('dragstart', () => {
			userInteracting = true;
		});

		// Resume spinning after interaction ends
		map.on('moveend', () => {
			spinGlobe();
		});

		spinGlobe();
	});
</script>

<svelte:head>
	<meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no" />
	<link href="https://api.mapbox.com/mapbox-gl-js/v3.9.3/mapbox-gl.css" rel="stylesheet" />
	<script src="https://api.mapbox.com/mapbox-gl-js/v3.9.3/mapbox-gl.js"></script>
</svelte:head>
<div class="container">
	<div bind:this={mapContainer} id="map" class="h-screen w-screen"></div>
	<div class="side-panel justify-center rounded-xl text-center">
		<h2 class="text-slate-200">Side Panel</h2>
	</div>
</div>

<style>
	.container {
		position: relative;
		width: 100vw;
		height: 100vh;
	}

	.side-panel {
		position: relative;
		top: 0;
		left: 0;
		width: 300px;
		height: 100vh;
		background-color: rgba(0, 0, 0, 0.8);
		padding: 16px;
		overflow-y: auto;
		z-index: 2; /* Ensures it's above the map */
	}

	#map {
		position: absolute;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: 1; /* Ensures the map is below the side-panel */
	}

</style>
