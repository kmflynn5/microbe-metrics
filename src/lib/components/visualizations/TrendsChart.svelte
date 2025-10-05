<script lang="ts">
	import { onMount } from "svelte";
	import * as d3 from "d3";

	interface TrendDataPoint {
		date: string;
		count: number;
		domain: string;
	}

	interface Props {
		data?: TrendDataPoint[];
		title?: string;
		width?: number;
		height?: number;
	}

	let {
		data = [],
		title = "Genome Projects Over Time",
		width = 800,
		height = 400,
	}: Props = $props();

	let chartContainer: HTMLDivElement;
	let mounted = $state(false);

	onMount(() => {
		mounted = true;
		renderChart();
	});

	$effect(() => {
		if (mounted && data.length > 0) {
			renderChart();
		}
	});

	function renderChart() {
		if (!chartContainer || data.length === 0) return;

		// Clear previous chart
		d3.select(chartContainer).selectAll("*").remove();

		// Set up dimensions and margins
		const margin = { top: 20, right: 120, bottom: 40, left: 60 };
		const chartWidth = width - margin.left - margin.right;
		const chartHeight = height - margin.top - margin.bottom;

		// Create SVG
		const svg = d3
			.select(chartContainer)
			.append("svg")
			.attr("width", width)
			.attr("height", height)
			.append("g")
			.attr("transform", `translate(${margin.left},${margin.top})`);

		// Parse dates
		const parseDate = d3.timeParse("%Y-%m-%d");
		const formattedData = data.map((d) => ({
			date: parseDate(d.date) || new Date(),
			count: d.count,
			domain: d.domain,
		}));

		// Group data by domain
		const domains = Array.from(new Set(formattedData.map((d) => d.domain)));
		const groupedData = domains.map((domain) => ({
			domain,
			values: formattedData
				.filter((d) => d.domain === domain)
				.sort((a, b) => a.date.getTime() - b.date.getTime()),
		}));

		// Set up scales
		const xScale = d3
			.scaleTime()
			.domain(d3.extent(formattedData, (d) => d.date) as [Date, Date])
			.range([0, chartWidth]);

		const yScale = d3
			.scaleLinear()
			.domain([0, d3.max(formattedData, (d) => d.count) || 0])
			.nice()
			.range([chartHeight, 0]);

		// Color scale
		const colorScale = d3
			.scaleOrdinal<string>()
			.domain(domains)
			.range(["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]);

		// Add grid lines
		svg
			.append("g")
			.attr("class", "grid")
			.attr("opacity", 0.1)
			.call(
				d3
					.axisLeft(yScale)
					.tickSize(-chartWidth)
					.tickFormat(() => ""),
			);

		// Add axes
		svg
			.append("g")
			.attr("transform", `translate(0,${chartHeight})`)
			.call(d3.axisBottom(xScale).ticks(6))
			.selectAll("text")
			.attr("fill", "currentColor");

		svg
			.append("g")
			.call(d3.axisLeft(yScale).ticks(6))
			.selectAll("text")
			.attr("fill", "currentColor");

		// Add Y axis label
		svg
			.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 0 - margin.left)
			.attr("x", 0 - chartHeight / 2)
			.attr("dy", "1em")
			.style("text-anchor", "middle")
			.attr("fill", "currentColor")
			.text("New Projects");

		// Line generator
		const line = d3
			.line<{ date: Date; count: number }>()
			.x((d) => xScale(d.date))
			.y((d) => yScale(d.count))
			.curve(d3.curveMonotoneX);

		// Add lines for each domain
		groupedData.forEach((group) => {
			svg
				.append("path")
				.datum(group.values)
				.attr("fill", "none")
				.attr("stroke", colorScale(group.domain))
				.attr("stroke-width", 2.5)
				.attr("d", line);

			// Add dots
			svg
				.selectAll(`.dot-${group.domain}`)
				.data(group.values)
				.enter()
				.append("circle")
				.attr("class", `dot-${group.domain}`)
				.attr("cx", (d) => xScale(d.date))
				.attr("cy", (d) => yScale(d.count))
				.attr("r", 4)
				.attr("fill", colorScale(group.domain))
				.attr("stroke", "white")
				.attr("stroke-width", 2);
		});

		// Add legend
		const legend = svg
			.selectAll(".legend")
			.data(domains)
			.enter()
			.append("g")
			.attr("class", "legend")
			.attr("transform", (d, i) => `translate(${chartWidth + 20},${i * 25})`);

		legend
			.append("rect")
			.attr("width", 18)
			.attr("height", 18)
			.attr("fill", (d) => colorScale(d));

		legend
			.append("text")
			.attr("x", 24)
			.attr("y", 9)
			.attr("dy", ".35em")
			.attr("fill", "currentColor")
			.style("font-size", "14px")
			.text((d) => d);

		// Add tooltip
		const tooltip = d3
			.select(chartContainer)
			.append("div")
			.style("position", "absolute")
			.style("visibility", "hidden")
			.style("background-color", "rgba(0, 0, 0, 0.8)")
			.style("color", "white")
			.style("padding", "8px 12px")
			.style("border-radius", "4px")
			.style("font-size", "12px")
			.style("pointer-events", "none");

		svg.selectAll("circle").on("mouseover", function (event, d: any) {
			tooltip
				.style("visibility", "visible")
				.html(
					`<strong>${d.domain}</strong><br/>Date: ${d3.timeFormat("%Y-%m-%d")(d.date)}<br/>Count: ${d.count}`,
				);
		});

		svg
			.selectAll("circle")
			.on("mousemove", function (event) {
				tooltip.style("top", event.pageY - 10 + "px").style("left", event.pageX + 10 + "px");
			})
			.on("mouseout", function () {
				tooltip.style("visibility", "hidden");
			});
	}
</script>

<div class="trends-chart">
	<h3 class="chart-title">{title}</h3>
	<div bind:this={chartContainer} class="chart-container"></div>
	{#if data.length === 0}
		<div class="empty-state">
			<p>No trend data available yet</p>
		</div>
	{/if}
</div>

<style>
	.trends-chart {
		width: 100%;
		background: white;
		border-radius: 8px;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.chart-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 1rem;
		color: #1f2937;
	}

	.chart-container {
		position: relative;
		width: 100%;
		overflow: visible;
	}

	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 200px;
		color: #6b7280;
	}

	:global(.dark) .trends-chart {
		background: #1f2937;
	}

	:global(.dark) .chart-title {
		color: #f3f4f6;
	}
</style>
