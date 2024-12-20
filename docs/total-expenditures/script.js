// Define variables
const margin = { top: 10, right: 20, bottom: 40, left: 60 };
const max_width = 500 - margin.left - margin.right;
const height = 3500 - margin.top - margin.bottom;

let width;
if (window.innerWidth >= max_width) {
    width = max_width;
} else {
    width = window.innerWidth - margin.left - margin.right;
}

// Load the data
d3.csv("clean.csv").then(function (data) {
    // Parse the date format and scale your data
    const parseDate = d3.timeParse("%Y-%m-%d");
    const formatDate = d3.timeFormat("%Y-%m-%d");

    data.forEach(d => {
        d.tx_date = parseDate(d.tx_date); // Convert tx_date to Date object
        d.amount = +d.amount; // Convert amount to a number
    });

    const colorMap = {
        "GrowSF": "#f67cf6", // Assign color for tag1
        "Abundance Network": "#efbe25", // Assign color for tag2
        "TogetherSF": "#8ad6ce"
    };
    
    // Create a custom color scale using the color map
    const colorScale = d3.scaleOrdinal()
        .domain(Object.keys(colorMap))
        .range(Object.values(colorMap));
    
    const yPositionScale = d3.scaleTime()
        .domain(d3.extent(data, d => d.tx_date))
        .range([150, height]);

    const radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(data, d => d.amount)])
        .range([0, 55]); // Adjust the range for bubble size

    // Create the SVG container for the scatterplot
    const svg = d3.select("#scatter")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create y-axis
    const y_axis = d3.axisLeft(yPositionScale);
    svg.append("g")
        .attr("class", "axis_labels")
        .attr("transform", `translate(30, 0)`)
        .call(y_axis);

    // Create the force simulation
    const simulation = d3.forceSimulation(data)
        .force("x", d3.forceX(width / 2).strength(0.2))
        .force("y", d3.forceY(d => yPositionScale(d.tx_date)).strength(0.2))
        .force("collide", d3.forceCollide(d => radiusScale(d.amount) + 1))
        .stop();

    // Run the simulation and position the bubbles
    for (let i = 0; i < 300; ++i) simulation.tick();

    // Define the tooltip
    const tooltip = d3.select("#scatter").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("background", "#ffffffee")
        .style("font-size", "16px")
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("z-index", "10");

    // Add bubbles
    const bubbles = svg.selectAll(".bubble")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "bubble")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", d => radiusScale(d.amount))
        .attr("fill", d => colorScale(d.tag)) // Color based on "tag"
        .attr("fill-opacity", 0.85)
        .attr("stroke", d => colorScale(d.tag))
        .on("mouseover", function (event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`
                <b>${d.name}</b><br>
                Date: ${formatDate(d.tx_date)}<br>
                Contribution amount: ${d.amount}<br>
                Category: ${d.candidate_or_measure}
            `)
            .style("left", (d3.select(this).attr("cx") - tooltip.node().getBoundingClientRect().width / 4) + "px")
            .style("top", (d3.select(this).attr("cy") - 40) + "px"); // Adjust 40px to control distance above the bubble
        })        
        .on("mouseout", function () {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
});