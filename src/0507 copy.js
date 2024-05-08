import * as d3 from "d3";
import "./viz.css";

// Initialization
const svg = d3.select("#svg-container").append("svg").attr("id", "svg");
let width = parseInt(d3.select("#svg-container").style("width"));
let height = parseInt(d3.select("#svg-container").style("height"));
const margin = { top: 20, right: 10, bottom: 100, left: 10 };

// Scales
const xScale = d3
  .scaleBand()
  .range([margin.left, width - margin.right])
  .paddingInner(0.1);

const colorScale = d3
  .scaleSequential()
  .domain([-0.8, 0.8]) // Adjust if needed
  .interpolator(d3.interpolatePuOr);

const yScale = d3
  .scaleBand()
  .domain(["min", "avg", "max"])
  .range([margin.top, height - margin.bottom])
  .paddingInner(0.1);

// Load CSV data
d3.csv("data/temperature-anomaly-data.csv")
  .then((raw_data) => {
    // Parse and filter data
    let data = raw_data
      .filter((d) => d.Entity === "Global")
      .map((d) => ({
        year: parseInt(d.Year),
        min: +d["Global minimum temperature anomaly relative to 1961-1990"],
        avg: +d["Global average temperature anomaly relative to 1961-1990"],
        max: +d["Global maximum temperature anomaly relative to 1961-1990"],
      }));

    // Update scales
    xScale.domain(data.map((d) => d.year));
    yScale.domain(["min", "avg", "max"]);

    // Create rectangles for heatmap
    data.forEach((datum) => {
      ["min", "avg", "max"].forEach((metric) => {
        svg
          .append("rect")
          .attr("x", xScale(datum.year))
          .attr("y", yScale(metric))
          .attr("width", xScale.bandwidth())
          .attr("height", yScale.bandwidth())
          .attr("fill", colorScale(datum[metric]));
      });
    });

    // Axes
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(
        d3
          .axisBottom(xScale)
          .tickValues(xScale.domain().filter((d, i) => !(i % 10)))
      );
  })
  .catch((error) => {
    console.error("Error loading CSV data: ", error);
  });

// Resize event listener
window.addEventListener("resize", () => {
  // Update dimensions
  width = parseInt(d3.select("#svg-container").style("width"));
  height = parseInt(d3.select("#svg-container").style("height"));

  // Update scales
  xScale.range([margin.left, width - margin.right]);
  yScale.range([margin.top, height - margin.bottom]);

  // Update elements
  svg
    .selectAll("rect")
    .attr("x", (d) => xScale(d.year))
    .attr("y", (d) => yScale(d.type))
    .attr("width", xScale.bandwidth())
    .attr("height", yScale.bandwidth());
});
