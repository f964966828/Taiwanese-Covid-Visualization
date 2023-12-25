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
const townGroup = svg.append("g").attr("id", "townGroup");
const countryGroup = svg.append("g").attr("id", "countryGroup");

// Map and projection
const projection = d3.geoMercator()
    .center([121, 23.7])         // 中心的經緯度
    .scale(10000)                // zoom parameter
    .translate([width / 2, height / 2])
const pathGenerator = d3.geoPath().projection(projection);

// Define zoom behavior
const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", (event) => {
        townGroup.attr("transform", event.transform);
        countryGroup.attr("transform", event.transform);
    });

function resetZoom() {
    svg.transition()
       .duration(750) // Smooth transition
       .call(zoom.transform, d3.zoomIdentity); // Reset zoom
}

function draw_town(data) {
    d3.json("./TopoJSON/TOWN_MOI_1120825.json").then(topoJsonData => {
        // Convert from TopoJSON to GeoJSON
        const geometries = topojson.feature(topoJsonData, topoJsonData.objects["TOWN_MOI_1120825"]);

        // Draw the map
        townGroup
            .selectAll("path")
            .data(geometries.features)
            .join("path")
            .attr("fill", "gray")
            .attr("d", pathGenerator)
            .style("stroke", "none")
            .on("mouseover", function (event, d) {
                var country = d.properties.COUNTYNAME.replace('臺', '台');
                var town = d.properties.TOWNNAME.replace('臺', '台');
                console.log(country, town);
                console.log(data[country][town]);
            })
    })
}

function draw_slider() {
    // slider constants
    const sliderX = 400;
    const sliderY = 750;
    const sliderWidth = 300;

    // define slider
    const slider = d3.sliderTop()
        .min(0).max(100).step(1)
        .default([0, 100])
        .ticks(0)
        .width(sliderWidth)
        .on("onchange", function(val){
        });
    
    // draw slider
    svg.append("g")
        .attr("class", "my-slider")
        .attr("transform", `translate(${sliderX}, ${sliderY})`)
        .call(slider)
        .append("text")
            .attr("class", "label")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "hanging")
            .attr("x", sliderWidth/2)
            .attr("y", 15)
            .text("Time");
}

function draw_country(data) {
    d3.json("./TopoJSON/COUNTY_MOI_1090820.json").then(topoJsonData => {
        // Convert from TopoJSON to GeoJSON
        const geometries = topojson.feature(topoJsonData, topoJsonData.objects["COUNTY_MOI_1090820"]);

        // Draw the map
        countryGroup
            .selectAll("path")
            .data(geometries.features)
            .join("path")
            .attr("fill", "none") // fill none here, just show the stroke
            .attr("d", pathGenerator)
            .style("stroke", "black")
            .style("stroke-width", "1px");
    })
}

export function draw(data) {
    // Apply zoom behavior to the SVG
    svg.call(zoom);

    // Set reset button function
    d3.select("#zoom-reset-button").on("click", resetZoom);

    draw_town(data);
    draw_country(data);

    draw_slider();
}
