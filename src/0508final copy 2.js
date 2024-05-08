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
  .range([height - margin.bottom - 150, margin.top + 80]); // Map these to the height range

const colorScale = d3
  .scaleSequential()
  .domain([0.8, -0.8])
  .interpolator(d3.interpolateBrBG);

const xLegendScale = d3
  .scaleBand()
  .range([width / 2 - 300, width / 2 + 300])
  .paddingInner(0.05);

const lineGenerator = d3
  .line()
  .x((d) => xScale(d.year) + xScale.bandwidth() / 2) // Center the line in each band
  .y((d) => yScale(d.avg)); // Assume yScale is already defined to scale temperature values

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
        "Upper bound of the annual temperature anomaly (95% confidence interval)"
      ],
      avg: +d["Global average temperature anomaly relative to 1961-1990"],
      max: +d[
        "Lower bound of the annual temperature anomaly (95% confidence interval)"
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

  //  -update
  xScale.range([margin.left, width - margin.right]);
  xLegendScale.domain(legendData.map((d, i) => i));

  //   // Render heatmaps for min, avg, max
  //   ["min", "avg", "max"].forEach((key, index) => {
  //     svg
  //       .selectAll(".rect-" + key)
  //       .data(data)
  //       .enter()
  //       .append("rect")
  //       .attr("x", (d) => xScale(d.year))
  //       .attr("y", margin.top + index * rowHeight)
  //       .attr("width", xScale.bandwidth())
  //       .attr("height", rowHeight - 1)
  //       .attr("fill", (d) => colorScale(d[key]));
  //   });

  // Render heatmaps for min, avg, max

  max = svg
    .selectAll("rects")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", (d) => xScale(d.year))
    .attr("y", margin.top)
    .attr("width", xScale.bandwidth())
    .attr("height", rowHeight / 2)
    .attr("fill", (d) => colorScale(d.min));

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
    .attr("fill", (d) => colorScale(d.max));

  svg
    .append("path")
    .datum(data) // Bind the data array to the path element
    .attr("class", "line") // Optional: for styling via CSS
    .attr("d", lineGenerator) // Apply the line generator to create the "d" attribute
    .attr("fill", "none")
    .attr("stroke", "none") // Set the color of the line
    .attr("stroke-width", 1); // Set the thickness of the line
  // Legend - optional update if needed for clarity

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

  xLegendScale.range([width / 2 - 140, width / 2 + 140]);

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
  //   .select(".line") // Select the line by class name
  //   .attr("d", lineGenerator); // Redraw the line with the updated scales

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
    .attr("height", 20);

  legendlabels
    .attr("x", (d, i) => xLegendScale(i) + xLegendScale.bandwidth() / 2)
    .attr("y", height - margin.bottom + 50 + 15);

  xAxis.scale(xScale); // Update the scale used by x-axis
  d3.select(".x-axis") // Select the existing x-axis in the SVG
    .call(xAxis) // Re-apply the axis to adjust tick positions and labels
    .attr("transform", `translate(0,${height - margin.bottom})`);

  // Previous resize updates
  // Update yScale range in case height has changed
  // Update scale domains
  // // Render x-axis
  // d3.select(".x-axis");
  // xAxis.attr("transform", `translate(0,${height - margin.bottom})`).call(xAxis);
  // xAxis = d3
  //   .axisBottom(xScale)
  //   .tickValues(xScale.domain().filter((d) => !(d % 10)));
  // xAxis
  //   .axisBottom(xScale)
  //   .tickValues(xScale.domain().filter((d) => !(d % 10)))
  //   .attr("transform", `translate(0,${height - margin.bottom})`)
  //   .attr("class", "x-axis")
  //   .attr("color", "white");
  // //  unit
  // unit
  //   .attr("x", xLegendScale(legendData.length - 1) + 60)
  //   .attr("y", height - margin.bottom + 50 + 15);
  //  axis updated
  // xAxis
  //   .tickValues(xScale.domain().filter((d) => !(d % 10)))
  //   .axisBottom(xScale)
  //   .range([margin.left, width - margin.right])
  //   .attr("transform", `translate(0,${height - margin.bottom})`);
  // d3.select(".x-axis")
  //   .attr("transform", `translate(0,${height - margin.bottom})`)
  //   .call(xAxis);
});
