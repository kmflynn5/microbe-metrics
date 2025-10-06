<script lang="ts">
	import { page } from "$app/stores";
	import { onMount } from "svelte";

	let darkMode = $state(false);

	onMount(() => {
		// Check for saved theme preference or default to light mode
		const savedTheme = localStorage.getItem("theme");
		const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

		darkMode = savedTheme === "dark" || (!savedTheme && prefersDark);
		updateTheme();
	});

	function toggleDarkMode() {
		darkMode = !darkMode;
		updateTheme();
	}

	function updateTheme() {
		if (darkMode) {
			document.documentElement.classList.add("dark");
			localStorage.setItem("theme", "dark");
		} else {
			document.documentElement.classList.remove("dark");
			localStorage.setItem("theme", "light");
		}
	}

	const navigation = [
		{ name: "Dashboard", href: "/", current: false },
		{ name: "Taxonomy", href: "/taxonomy", current: false },
		{ name: "Analytics", href: "/analytics", current: false },
		{ name: "Organisms", href: "/organisms", current: false },
		{ name: "Pipeline", href: "/pipeline", current: false },
		{ name: "About", href: "/about", current: false },
	];

	$effect(() => {
		// Update current navigation item based on current page
		navigation.forEach((item) => {
			item.current =
				$page.url.pathname === item.href ||
				($page.url.pathname.startsWith(item.href) && item.href !== "/");
		});
	});
</script>

<header class="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between items-center h-16">
			<!-- Logo and title -->
			<div class="flex items-center space-x-4">
				<div class="flex-shrink-0">
					<div class="h-10 w-10 bg-primary-600 rounded-lg flex items-center justify-center">
						<svg
							class="h-6 w-6 text-white"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L7 12.5l2.091 2.091a2.25 2.25 0 01.659 1.591v5.714M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
				</div>
				<div>
					<h1 class="text-xl font-bold text-gray-900 dark:text-white">JGI Genomics Analytics</h1>
					<p class="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
						Bacterial & Archaeal Genome Analysis Pipeline
					</p>
				</div>
			</div>

			<!-- Navigation -->
			<nav class="hidden md:flex space-x-8">
				{#each navigation as item}
					<a
						href={item.href}
						class="inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors duration-200 {item.current
							? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
							: 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100'}"
					>
						{item.name}
					</a>
				{/each}
			</nav>

			<!-- Theme toggle and mobile menu -->
			<div class="flex items-center space-x-4">
				<!-- Dark mode toggle -->
				<button
					onclick={toggleDarkMode}
					class="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
					aria-label="Toggle dark mode"
				>
					{#if darkMode}
						<!-- Sun icon -->
						<svg
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
							/>
						</svg>
					{:else}
						<!-- Moon icon -->
						<svg
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
							/>
						</svg>
					{/if}
				</button>

				<!-- Mobile menu button -->
				<button
					class="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
					aria-label="Open mobile menu"
				>
					<svg
						class="h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
						/>
					</svg>
				</button>
			</div>
		</div>
	</div>

	<!-- Mobile navigation menu -->
	<div class="md:hidden border-t border-gray-200 dark:border-gray-700">
		<div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
			{#each navigation as item}
				<a
					href={item.href}
					class="block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 {item.current
						? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
						: 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'}"
				>
					{item.name}
				</a>
			{/each}
		</div>
	</div>
</header>
