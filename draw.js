// The svg
const svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

// Map and projection
const projection = d3.geoMercator()
    .center([122, 22])          // 中心的經緯度
    .scale(8000)                // zoom parameter
    .translate([width / 2, height / 2])
const pathGenerator = d3.geoPath().projection(projection);

export function draw_town(data) {
    d3.json("./TopoJSON/TOWN_MOI_1120825.json").then(topoJsonData => {
        // Convert from TopoJSON to GeoJSON
        const geometries = topojson.feature(topoJsonData, topoJsonData.objects["TOWN_MOI_1120825"]);

        // Draw the map
        svg.append("g")
            .selectAll("path")
            .data(geometries.features)
            .join("path")
            .attr("fill", "gray")
            .attr("d", pathGenerator)
            .style("stroke", "none")
            .on("mouseover", function(event, d) {
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
        svg.append("g")
            .selectAll("path")
            .data(geometries.features)
            .join("path")
            .attr("fill", "none") // fill none here, just show the stroke
            .attr("d", pathGenerator)
            .style("stroke", "black")
            .style("stroke-width", "2px");
    })
}
