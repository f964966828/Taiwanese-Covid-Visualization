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
    /*const colorScaleConfirm = d3.linear()
        .domain([])
        .range(["gray", "red"])*/

    d3.json("./TopoJSON/TOWN_MOI_1120825.json").then(topoJsonData => {
        // Convert from TopoJSON to GeoJSON
        const geometries = topojson.feature(topoJsonData, topoJsonData.objects["TOWN_MOI_1120825"]);


        // date object to numeric
        function dateToNum(date){
            const y = date.getFullYear();
            const m = date.getMonth() + 1;
            const d = date.getDate();
            return y*10000 + m*100 + d;
        }

        // numeric date to object
        function numToDate(num, offset){
            const y = Math.floor(num/10000);
            const m = Math.floor((num%10000)/100) - 1;
            const d = (num%100) + offset;
            return new Date(y, m, d);
        }


        // 給定區域，計算近七天的確診人數(原資料會有缺失值)
        function countConfirmed(country, town, t){
            const arr = data[country][town].confirmed.map(d => (
                +d["個案研判日"].replaceAll("-", "")
            ));
            
            // upper index (now)
            const upperIdx = arr.length - d3.bisectRight(arr.slice().reverse(), t);
            if (upperIdx == arr.length){  // no one confirmed
                return 0;
            }

            // lower index (now)
            const last7_day = numToDate(t, -7);
            const last7_t = dateToNum(last7_day);
            const lowerIdx = arr.length - d3.bisectRight(arr.slice().reverse(), last7_t);
            
            // compute cases
            if (lowerIdx == arr.length){
                const upper = +data[country][town].confirmed[upperIdx]["累計確診人數"];
                return upper;
            }
            else{
                const upper = +data[country][town].confirmed[upperIdx]["累計確診人數"];
                const lower = +data[country][town].confirmed[lowerIdx]["累計確診人數"];
                return upper - lower;
            }
        }


        // compute max case
        let confirmedMax = 0;
        for(let country of Object.keys(data)){
            if (country == '全國'){
                continue;
            }
            for(let town of Object.keys(data[country])){
                if (town == '全區'){
                    continue;
                }
                for(let d of data[country][town].confirmed){
                    confirmedMax = Math.max(confirmedMax, Math.round(d['七天移動平均新增確診人數']*7))
                }
            }

        }
        //console.log(confirmedMax);


        // compute time range
        let timeMin = 90121231
        let timeMax = 0;
        for(let country of Object.keys(data)){
            if (country == '全國'){
                continue;
            }
            for(let d of data[country]['全區'].confirmed){
                const t = +d["個案研判日"].replaceAll("-", "");
                timeMax = Math.max(timeMax, t);
                timeMin = Math.min(timeMin, t);
            }
        }
        console.log(timeMin);
        console.log(timeMax);


        // color scale
        const colorScale = d3.scaleLinear()
            .domain([0, confirmedMax])
            .range(["#ffffff", "#ff0000"]);

        
        // Draw the map
        const towns = townGroup
            .selectAll("path")
            .data(geometries.features)
            .join("path")
                .attr("fill", d => {
                    const country = d.properties.COUNTYNAME.replace('臺', '台');
                    const town = d.properties.TOWNNAME.replace('臺', '台');
                    return colorScale(countConfirmed(country, town, 20200128));
                })
                .attr("d", pathGenerator)
                .style("stroke", "none");
                
        const townsTooltip = towns.append("title")
            .text(d => {
                const country = d.properties.COUNTYNAME.replace('臺', '台');
                const town = d.properties.TOWNNAME.replace('臺', '台');
                return `20200128-${country}-${town}: ${countConfirmed(country, town, 20200128)} cases in 7 days`;
            });
        
        
        // draw slider
        function draw_slider() {
            // slider constants
            const sliderX = 100;
            const sliderY = 750;
            const sliderWidth = 500;
        
            // define slider
            const slider = d3.sliderTop()
                .min(0).max(1318).step(1)
                .default(0)
                .ticks(0)
                .width(sliderWidth)
                .on("onchange", function(val){
                    const dateNum = dateToNum(numToDate(20200128, val));

                    towns.attr("fill", d=>{
                        const country = d.properties.COUNTYNAME.replace('臺', '台');
                        const town = d.properties.TOWNNAME.replace('臺', '台');
                        const cases = countConfirmed(country, town, dateNum);
                        return colorScale(cases);
                    });
                    townsTooltip.text(d=>{
                        const country = d.properties.COUNTYNAME.replace('臺', '台');
                        const town = d.properties.TOWNNAME.replace('臺', '台');
                        const cases = countConfirmed(country, town, dateNum);
                        return `${dateNum}-${country}-${town}: ${cases} cases in 7 days`;
                    });

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

        draw_slider();
        
    })
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
}
