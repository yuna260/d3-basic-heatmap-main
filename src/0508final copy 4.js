import * as d3 from "d3";
import "./viz.css";

// SVG container setup
const svg = d3.select("#svg-container").append("svg").attr("id", "svg");
let width = parseInt(d3.select("#svg-container").style("width"));
let height = parseInt(d3.select("#svg-container").style("height"));
const margin = { top: 20, right: 10, bottom: 100, left: 50 }; // Adjusted left margin for y-axis

// Scales and axis setups
const xScale = d3
  .scaleBand()
  .range([margin.left, width - margin.right])
  .paddingInner(0.05);
const yScale = d3.scaleLinear().range([height - margin.bottom, margin.top]);
const colorScale = d3.scaleSequential(d3.interpolateBrBG);
const xLegendScale = d3
  .scaleBand()
  .range([margin.left, width - margin.right])
  .paddingInner(0.05);

const lineGenerator = d3
  .line()
  .x((d) => xScale(d.year) + xScale.bandwidth() / 2)
  .y((d) => yScale(d.avg))
  .curve(d3.curveMonotoneX);

// Load and process data
d3.csv("data/temperature-anomaly-data.csv").then((raw_data) => {
  let data = raw_data
    .filter((d) => d.Entity === "Global")
    .map((d) => ({
      year: parseInt(d.Year),
      min: +d[
        "Lower bound of the annual temperature anomaly (95% confidence interval)"
      ],
      avg: +d["Global average temperature anomaly relative to 1961-1990"],
      max: +d[
        "Upper bound of the annual temperature anomaly (95% confidence interval)"
      ],
    }));

  // Update scale domains
  xScale.domain(data.map((d) => d.year));
  yScale.domain([d3.min(data, (d) => d.min), d3.max(data, (d) => d.max)]);
  colorScale.domain([d3.min(data, (d) => d.avg), d3.max(data, (d) => d.avg)]);

  // Append axes
  const xAxis = d3
    .axisBottom(xScale)
    .tickValues(xScale.domain().filter((year) => year % 10 === 0));
  const yAxis = d3.axisLeft(yScale).ticks(10);

  svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xAxis);

  svg
    .append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(yAxis);

  // Heatmaps for min, avg, max
  ["min", "avg", "max"].forEach((key, index) => {
    svg
      .selectAll(`.rect-${key}`)
      .data(data)
      .enter()
      .append("rect")
      .attr("x", (d) => xScale(d.year))
      .attr("y", (d) => yScale(d[key]))
      .attr("width", xScale.bandwidth())
      .attr("height", (d) => height - margin.bottom - yScale(d[key]))
      .attr("fill", (d) => colorScale(d[key]));
  });

  // Line chart for average temperatures
  svg
    .append("path")
    .datum(data)
    .attr("class", "line")
    .attr("d", lineGenerator)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2);
});

// Resize event listener
window.addEventListener("resize", () => {
  width = parseInt(d3.select("#svg-container").style("width"));
  height = parseInt(d3.select("#svg-container").style("height"));

  // Update scale ranges and axes
  xScale.range([margin.left, width - margin.right]);
  yScale.range([height - margin.bottom, margin.top]);
  xLegendScale.range([margin.left, width - margin.right]);

  svg.select(".x-axis").call(d3.axisBottom(xScale));
  svg.select(".y-axis").call(d3.axisLeft(yScale));

  // Update heatmap and line
  svg
    .selectAll("rect")
    .attr("x", (d) => xScale(d.year))
    .attr("width", xScale.bandwidth());
  svg.select(".line").attr("d", lineGenerator);
});
