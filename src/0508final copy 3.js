import * as d3 from "d3";
import "./viz.css";

////////////////////////////////////////////////////////////////////
////////////////////////////  Init  ///////////////////////////////
// SVG container
const svg = d3.select("#svg-container").append("svg").attr("id", "svg");

let width = parseInt(d3.select("#svg-container").style("width"));
let height = parseInt(d3.select("#svg-container").style("height"));
const margin = { top: 20, right: 50, bottom: 100, left: 50 }; // Adjusted margins to accommodate y-axis

// Scales
const xScale = d3
  .scaleBand()
  .range([margin.left, width - margin.right])
  .paddingInner(0);

const yScale = d3.scaleLinear().range([height - margin.bottom, margin.top]);

const colorScale = d3.scaleSequential().interpolator(d3.interpolateBrBG);

const lineGenerator = d3
  .line()
  .x((d) => xScale(d.year) + xScale.bandwidth() / 2)
  .y((d) => yScale(d.avg))
  .curve(d3.curveMonotoneX);

////////////////////////////////////////////////////////////////////
////////////////////////////  Load CSV  ////////////////////////////
let data = [];

// Data loading and processing
d3.csv("data/temperature-anomaly-data.csv").then((raw_data) => {
  data = raw_data
    .filter((d) => d.Entity == "Global")
    .map((d) => ({
      year: parseInt(d.Year),
      avg: +d["Global average temperature anomaly relative to 1961-1990"],
      min: +d[
        "Lower bound of the annual temperature anomaly (95% confidence interval)"
      ],
      max: +d[
        "Upper bound of the annual temperature anomaly (95% confidence interval)"
      ],
    }));

  // Update scale domains
  xScale.domain(data.map((d) => d.year));
  yScale.domain([d3.min(data, (d) => d.avg), d3.max(data, (d) => d.avg)]);
  colorScale.domain([d3.min(data, (d) => d.avg), d3.max(data, (d) => d.avg)]);

  // Axis
  const xAxis = d3
    .axisBottom(xScale)
    .tickValues(xScale.domain().filter((d) => !(d % 10)));
  const yAxis = d3.axisLeft(yScale).ticks(10);

  // Render x-axis
  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xAxis);

  // Render y-axis
  svg.append("g").attr("transform", `translate(${margin.left},0)`).call(yAxis);

  // Render line chart
  svg
    .append("path")
    .datum(data)
    .attr("class", "line")
    .attr("d", lineGenerator)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2);

  // Render heatmaps for min, avg, max
  svg
    .selectAll(".rect-avg")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", (d) => xScale(d.year))
    .attr("y", (d) => yScale(d.avg))
    .attr("width", xScale.bandwidth())
    .attr("height", (d) => height - margin.bottom - yScale(d.avg))
    .attr("fill", (d) => colorScale(d.avg));
});

////////////////////////////////////////////////////////////////////
////////////////////////////  Resize  //////////////////////////////
window.addEventListener("resize", () => {
  width = parseInt(d3.select("#svg-container").style("width"));
  height = parseInt(d3.select("#svg-container").style("height"));

  // Update scale ranges
  xScale.range([margin.left, width - margin.right]);
  yScale.range([height - margin.bottom, margin.top]);

  // Update the x-axis
  svg
    .select(".x-axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xScale));

  // Update the y-axis
  svg.select(".y-axis").call(d3.axisLeft(yScale));

  // Update the line chart
  svg.select(".line").attr("d", lineGenerator);

  // Update heatmap rects
  svg
    .selectAll(".rect-avg")
    .attr("x", (d) => xScale(d.year))
    .attr("y", (d) => yScale(d.avg))
    .attr("width", xScale.bandwidth())
    .attr("height", (d) => height - margin.bottom - yScale(d.avg));
});
