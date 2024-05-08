import * as d3 from "d3";
import "./viz.css";

////////////////////////////////////////////////////////////////////
////////////////////////////  Init  ///////////////////////////////
// SVG container
const svg = d3.select("#svg-container").append("svg").attr("id", "svg");

let width = parseInt(d3.select("#svg-container").style("width"));
let height = parseInt(d3.select("#svg-container").style("height"));
const margin = { top: 20, right: 10, bottom: 100, left: 10 };

// Scales
const xScale = d3
  .scaleBand()
  .range([margin.left, width - margin.right])
  .paddingInner(0);

const yScale = d3
  .scaleLinear()
  .range([height - margin.bottom - 150, margin.top + 80]);

const colorScale = d3
  .scaleSequential()
  .domain([0.8, -0.8])
  .interpolator(d3.interpolateBrBG);

const xLegendScale = d3
  .scaleBand()
  .range([width / 2 - 300, width / 2 + 300])
  .paddingInner(0.05);

// const lineGenerator = d3
//   .line()
//   .x((d) => xScale(d.year) + xScale.bandwidth() / 2)
//   .y((d) => yScale(d.avg));

// SVG elements
let rects;
let min, avg, max;
let legendrects;
let xAxis;
let legendlabels;
let rowHeight;
let path;
let line;

////////////////////////////////////////////////////////////////////
////////////////////////////  Load CSV  ////////////////////////////
let data = [];
let legendData;

// Data loading and processing
d3.csv("data/temperature-anomaly-data.csv").then((raw_data) => {
  data = raw_data
    .filter((d) => d.Entity == "Global")
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

  legendData = d3.range(
    d3.min(data, (d) => d.avg),
    d3.max(data, (d) => d.avg),
    0.2
  );
  // Update scale domains
  xScale.domain(data.map((d) => d.year));
  xAxis = d3
    .axisBottom(xScale)
    .tickValues(xScale.domain().filter((d) => !(d % 10)));

  // Render x-axis
  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .attr("class", "x-axis")
    .call(xAxis)
    .attr("color", "white");

  // Adjust the height for multiple rows
  const rowHeight = (height - margin.top - margin.bottom - 10) / 2;

  //  update
  xScale.range([margin.left, width - margin.right]);
  xLegendScale.domain(legendData.map((d, i) => i));

  //  heatmaps
  max = svg
    .selectAll("rects")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", (d) => xScale(d.year))
    .attr("y", margin.top)
    .attr("width", xScale.bandwidth())
    .attr("height", rowHeight / 2)
    .attr("fill", (d) => colorScale(d.max));

  avg = svg
    .selectAll("rects")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", (d) => xScale(d.year))
    .attr("y", margin.top + rowHeight / 2 + 5)
    .attr("width", xScale.bandwidth())
    .attr("height", (d) => yScale(d.avg) - margin.bottom)
    .attr("fill", (d) => colorScale(d.avg));

  min = svg
    .selectAll("rects")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", (d) => xScale(d.year))
    .attr("y", margin.top + rowHeight + rowHeight / 2 + 10)
    .attr("width", xScale.bandwidth())
    .attr("height", rowHeight / 2)
    .attr("fill", (d) => colorScale(d.min));

  // legends
  legendrects = svg
    .selectAll("legend-labels")
    .data(legendData)
    .enter()
    .append("rect")
    .attr("x", (d, i) => xLegendScale(i))
    .attr("y", height - margin.bottom + 50)
    .attr("width", xLegendScale.bandwidth())
    .attr("height", 20)
    .attr("fill", (d) => colorScale(d));

  legendlabels = svg
    .selectAll("legend-labels")
    .data(legendData)
    .enter()
    .append("text")
    .attr("x", (d, i) => xLegendScale(i) + xLegendScale.bandwidth() / 2)
    .attr("y", height - margin.bottom + 65)
    .text((d) => d3.format("0.1f")(d))
    .attr("class", "legend-labels")
    .style("fill", (d) => (d >= 0.5 ? "#fff" : "#111"));

  // tooltip and color changing
  const tooltip = d3
    .select("#svg-container")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0.5)
    .style("position", "absolute")
    .style("background", "black")
    .style("color", "white")
    .style("border", "0.5px solid #ccc")
    .style("padding", "10px")
    .style("border-radius", "10px")
    .style("pointer-events", "none");
  svg
    .selectAll("rect")
    .on("mouseover", function (event, d) {
      d3.select(this).transition().duration(100).attr("fill", "salmon");
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip
        .html(`Year: ${d.year}<br/>Value: ${d.avg.toFixed(2)}`)
        .style("left", event.pageX + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function (d) {
      d3.select(this)
        .transition()
        .duration(100)
        .attr("fill", (d) => colorScale(d.avg));
      tooltip.transition().duration(500).style("opacity", 0);
    });
});

////////////////////////////////////////////////////////////////////
////////////////////////////  Resize  //////////////////////////////
window.addEventListener("resize", () => {
  //  width, height updated
  width = parseInt(d3.select("#svg-container").style("width"));
  height = parseInt(d3.select("#svg-container").style("height"));
  rowHeight = parseInt(height - margin.top - margin.bottom - 10) / 2;

  //  scale updated
  xScale.range([margin.left, width - margin.right]);

  yScale.range([height - margin.bottom - 150, margin.top + 50]); // Map these to the height range

  xLegendScale.range([width / 2 - 300, width / 2 + 300]);

  // heatmap

  max
    .attr("x", (d) => xScale(d.year))
    .attr("y", margin.top)
    .attr("width", xScale.bandwidth())
    .attr("height", rowHeight / 2);

  avg
    .attr("x", (d) => xScale(d.year))
    .attr("y", margin.top + rowHeight / 2 + 5)
    .attr("width", xScale.bandwidth())
    .attr("height", (d) => -margin.bottom + yScale(d.avg));

  min
    .attr("x", (d) => xScale(d.year))
    .attr("y", margin.top + rowHeight + rowHeight / 2 + 10)
    .attr("width", xScale.bandwidth())
    .attr("height", rowHeight / 2);

  // line
  //   .select(".line")
  //   .attr("d", lineGenerator);

  // rects
  //   .attr("x", (d) => xScale(d.year))
  //   .attr("y", margin.top)
  //   .attr("width", xScale.bandwidth())
  //   .attr("height", height - margin.top - margin.bottom);

  // legend
  legendrects
    .attr("x", (d, i) => xLegendScale(i))
    .attr("y", height - margin.bottom + 50)
    .attr("width", xLegendScale.bandwidth())
    .attr("height", 20)
    .attr("fill", (d) => colorScale(d));

  legendlabels
    .attr("x", (d, i) => xLegendScale(i) + xLegendScale.bandwidth() / 2)
    .attr("y", height - margin.bottom + 50 + 15);

  xAxis.scale(xScale); // Update the scale used by x-axis
  d3.select(".x-axis") // Select the existing x-axis in the SVG
    .call(xAxis) // Re-apply the axis to adjust tick positions and labels
    .attr("transform", `translate(0,${height - margin.bottom})`);
});
