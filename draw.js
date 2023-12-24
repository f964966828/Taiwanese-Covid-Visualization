// The svg
const svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

// Append a rectangle to act as a border
svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "none")        // No fill color
    .style("stroke", "black")     // Border color
    .style("stroke-width", "2px"); // Border width

// Create a group element to contain the map
const g = svg.append("g");

// Map and projection
const projection = d3.geoMercator()
    .center([121, 23.5])          // 中心的經緯度
    .scale(12000)                // zoom parameter
    .translate([width / 2, height / 2])
const pathGenerator = d3.geoPath().projection(projection);

// Define zoom behavior
const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", (event) => {
        console.log(event);
        g.attr("transform", event.transform);
    });

// Apply zoom behavior to the SVG
svg.call(zoom);

function resetZoom() {
    svg.transition()
       .duration(750) // Smooth transition
       .call(zoom.transform, d3.zoomIdentity); // Reset zoom
}

d3.select("#zoom-reset-button").on("click", resetZoom);

export function draw_town(data) {
    d3.json("./TopoJSON/TOWN_MOI_1120825.json").then(topoJsonData => {
        // Convert from TopoJSON to GeoJSON
        const geometries = topojson.feature(topoJsonData, topoJsonData.objects["TOWN_MOI_1120825"]);

        // Draw the map
        g
            .selectAll("path")
            .data(geometries.features)
            .join("path")
            .attr("fill", "gray")
            .attr("d", pathGenerator)
            .style("stroke", "none")
            .on("mouseover", function (event, d) {
                var country = d.properties.COUNTYNAME.replace('臺', '台');
                var town = d.properties.TOWNNAME;
                console.log(country, town);
                console.log(data[country][town]);
            })
    })
}

export function draw_country(data) {
    d3.json("./TopoJSON/COUNTY_MOI_1090820.json").then(topoJsonData => {
        // Convert from TopoJSON to GeoJSON
        const geometries = topojson.feature(topoJsonData, topoJsonData.objects["COUNTY_MOI_1090820"]);

        // Draw the map
        g
            .selectAll("path")
            .data(geometries.features)
            .join("path")
            .attr("fill", "none") // fill none here, just show the stroke
            .attr("d", pathGenerator)
            .style("stroke", "black")
            .style("stroke-width", "2px");
    })
}
