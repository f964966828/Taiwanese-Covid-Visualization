let dateNum = 20200128;
let data = {};
let dataset = (() => {
    const datasetName = d3.select("#dataset").property("value");
    if (datasetName === "確診報表") {
        return "confirmed";
    } else if (datasetName === "死亡報表") {
        return "death";
    }
})();

// date object to numeric
function dateToNum(date) {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return y * 10000 + m * 100 + d;
}

// numeric date to object
function numToDate(num, offset) {
    const y = Math.floor(num / 10000);
    const m = Math.floor((num % 10000) / 100) - 1;
    const d = (num % 100) + offset;
    return new Date(y, m, d);
}

function changeDataset(val) {
    const datasetName = d3.select(this).property("value");
    if (datasetName === "確診報表") {
        dataset = "confirmed";
    } else if (datasetName === "死亡報表") {
        dataset = "death";
    }
    update();
}

// 給定區域，計算近七天的確診人數(原資料會有缺失值)
function countConfirmed(country, town, t) {
    const arr = data[country][town][dataset].map((d) => {
        if (dataset === "confirmed") {
            return +d["個案研判日"].replaceAll("-", "");
        } else if (dataset === "death") {
            return +d["個案死亡日"].replaceAll("-", "");
        }
    });

    // upper index (now)
    const upperIdx = arr.length - d3.bisectRight(arr.slice().reverse(), t);
    if (upperIdx == arr.length) {
        // no one confirmed
        return 0;
    }

    // lower index (now)
    const last7_day = numToDate(t, -7);
    const last7_t = dateToNum(last7_day);
    const lowerIdx = arr.length - d3.bisectRight(arr.slice().reverse(), last7_t);

    // compute cases
    if (lowerIdx == arr.length) {
        if (dataset === "confirmed") {
            return +data[country][town][dataset][upperIdx]["累計確診人數"];
        } else if (dataset === "death") {
            return +data[country][town][dataset][upperIdx]["累計死亡人數"];
        }
    } else {
        if (dataset === "confirmed") {
            return (
                +data[country][town][dataset][upperIdx]["累計確診人數"] -
                +data[country][town][dataset][lowerIdx]["累計確診人數"]
            );
        } else if (dataset === "death") {
            return (
                +data[country][town][dataset][upperIdx]["累計死亡人數"] -
                +data[country][town][dataset][lowerIdx]["累計死亡人數"]
            );
        }
        return 0;
    }
}

function newConfirmed(country, town, t) {
    const arr = data[country][town][dataset].map((d) => {
        if (dataset === "confirmed") {
            return +d["個案研判日"].replaceAll("-", "");
        } else if (dataset === "death") {
            return +d["個案死亡日"].replaceAll("-", "");
        }
    });

    // lower index (now)
    const last7_day = numToDate(t, -7);
    const last7_t = dateToNum(last7_day);
    const lowerIdx = arr.length - d3.bisectRight(arr.slice().reverse(), last7_t);

    var index = Math.min(lowerIdx - 1, arr.length - 1);
    var newConfirmedArr = [];

    for (let offset = -7 + 1; offset <= 0; offset++) {
        const curDay = numToDate(t, offset);
        const curT = dateToNum(curDay);
        if (arr[index] === curT) {
            newConfirmedArr.push({
                new: (() => {
                    if (dataset === "confirmed") {
                        return +data[country][town][dataset][index]["新增確診人數"];
                    } else if (dataset === "death") {
                        return +data[country][town][dataset][index]["新增死亡人數"];
                    }
                })(),
                date: numToDate(curT, 0),
            });
            index = index - 1;
        } else {
            newConfirmedArr.push({
                new: 0,
                date: numToDate(curT, 0),
            });
        }
    }

    return newConfirmedArr;
}

function drawMapChart() {
    // The svg
    const mapChart = d3.select("#taiwan-map"),
        width = +mapChart.attr("width"),
        height = +mapChart.attr("height");

    // Append a rectangle to act as a border
    mapChart
        .append("rect")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none") // No fill color
        .style("stroke", "black") // Border color
        .style("stroke-width", "2px"); // Border width

    // Create a group element to contain the map
    const townGroup = mapChart.append("g").attr("id", "townGroup");
    const countryGroup = mapChart.append("g").attr("id", "countryGroup");
    const zoom = d3
        .zoom()
        .scaleExtent([1, 8])
        .on("zoom", (event) => {
            townGroup.attr("transform", event.transform);
            countryGroup.attr("transform", event.transform);
        });
    // Apply zoom behavior to the SVG
    mapChart.call(zoom);
    // Set reset button function
    d3.select("#zoom-reset-button").on("click", () => {
        mapChart
            .transition()
            .duration(750) // Smooth transition
            .call(zoom.transform, d3.zoomIdentity); // Reset zoom
    });

    // Map and projection
    const projection = d3
        .geoMercator()
        .center([121, 23.7]) // 中心的經緯度
        .scale(10000) // zoom parameter
        .translate([width / 2, height / 2]);
    const pathGenerator = d3.geoPath().projection(projection);

    function drawCountry() {
        d3.json("./TopoJSON/COUNTY_MOI_1090820.json").then((topoJsonData) => {
            // Convert from TopoJSON to GeoJSON
            const geometries = topojson.feature(
                topoJsonData,
                topoJsonData.objects["COUNTY_MOI_1090820"],
            );

            // Draw the map
            countryGroup
                .selectAll("path")
                .data(geometries.features)
                .join("path")
                .attr("fill", "none") // fill none here, just show the stroke
                .attr("d", pathGenerator)
                .style("stroke", "black")
                .style("stroke-width", "1px");
        });
    }

    function drawTown() {
        d3.json("./TopoJSON/TOWN_MOI_1120825.json").then((topoJsonData) => {
            // Convert from TopoJSON to GeoJSON
            const geometries = topojson.feature(
                topoJsonData,
                topoJsonData.objects["TOWN_MOI_1120825"],
            );

            // Draw the map
            const towns = townGroup
                .selectAll("path")
                .data(geometries.features)
                .join("path")
                .attr("fill", "none")
                .attr("d", pathGenerator)
                .style("stroke", "none")
                .on("mouseover", (event, d) => {
                    d3.select(event.currentTarget)
                        .style("stroke", "purple")
                        .style("stroke-width", "3px");

                    const country = d.properties.COUNTYNAME.replace("臺", "台");
                    const town = d.properties.TOWNNAME.replace("臺", "台");
                    updateLineChart(country, town);
                })
                .on("mouseleave", (event, d) => {
                    const element = d3.select(event.currentTarget);
                    const active = element.attr("active") === "true";

                    if (!active) {
                        element
                            .style("stroke", "none");
                    }

                    updateLineChart();
                })
                .on("click", (event, d) => {
                    const element = d3.select(event.currentTarget);
                    const active = element.attr("active") === "true";
                    if (active) {
                        element
                            .style("stroke", "none")
                            .attr("active", "false");
                    } else {
                        element
                            .style("stroke", "purple")
                            .style("stroke-width", "3px")
                            .attr("active", "true");
                    }
                    updateLineCharts();
                })
        });
    }

    function drawSlider() {
        // slider constants
        const sliderX = 100;
        const sliderY = 750;
        const sliderWidth = 500;

        // define slider
        const slider = d3
            .sliderTop()
            .min(0)
            .max(1318)
            .step(1)
            .default(0)
            .ticks(0)
            .width(sliderWidth)
            .on("onchange", function (val) {
                dateNum = dateToNum(numToDate(20200128, val));
                update();
            });

        // draw slider
        mapChart
            .append("g")
            .attr("class", "my-slider")
            .attr("transform", `translate(${sliderX}, ${sliderY})`)
            .call(slider)
            .append("text")
            .attr("class", "label")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "hanging")
            .attr("x", sliderWidth / 2)
            .attr("y", 15)
            .text("Time");
    }
    drawCountry();
    drawTown();
    drawSlider();
}

function drawLineChart() {
    const margin = { top: 10, right: 30, bottom: 30, left: 60 };
    const lineChart = d3.select("#taiwan-line-chart"),
        width = +lineChart.attr("width") - margin.right - margin.left,
        height = +lineChart.attr("height") - margin.top - margin.bottom;

    lineChart
        .append("rect")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .style("fill", "none")
        .style("stroke", "black")
        .style("stroke-width", "2px");

    const g = lineChart
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Add X axis
    g.append("g")
        .attr("id", "xAxis")
        .attr("transform", "translate(0," + height + ")");

    // Add Y axis
    g.append("g").attr("id", "yAxis");

    // Add the line
    g.append("g").append("path").attr("id", "lines");

    // Add the points
    g.append("g").attr("id", "dots");
}

function drawLineCharts() {
    const margin = { top: 10, right: 30, bottom: 30, left: 60 };
    const lineCharts = d3.select("#taiwan-line-charts"),
        width = +lineCharts.attr("width") - margin.right - margin.left,
        height = +lineCharts.attr("height") - margin.top - margin.bottom;

    lineCharts
        .append("rect")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .style("fill", "none")
        .style("stroke", "black")
        .style("stroke-width", "2px");

    const g = lineCharts
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Add X axis
    g.append("g")
        .attr("id", "xAxis")
        .attr("transform", "translate(0," + height + ")");

    // Add Y axis
    g.append("g").attr("id", "yAxis");

    // Add the line
    g.append("g").attr("id", "lines");

    // Add the points
    g.append("g").attr("id", "dots");

    // Add the labels
    g.append("g").attr("id", "labels");
}

function updateMapChart() {
    // compute max case
    let confirmedMax = 0;
    for (let country of Object.keys(data)) {
        if (country == "全國") {
            continue;
        }
        for (let town of Object.keys(data[country])) {
            if (town == "全區") {
                continue;
            }
            for (let d of data[country][town][dataset]) {
                confirmedMax = Math.max(
                    confirmedMax,
                    (() => {
                        if (dataset === "confirmed") {
                            return Math.ceil(
                                Math.log(d["七天移動平均新增確診人數"] * 7) / Math.log(10),
                            );
                        } else if (dataset === "death") {
                            return Math.ceil(
                                Math.log(d["七天移動平均新增死亡人數"] * 7) / Math.log(10),
                            );
                        }
                    })(),
                );
            }
        }
    }
    // color scale
    const colorScale = d3
        .scaleLinear()
        .domain([0, confirmedMax])
        .range(["#ffffff", "#ff0000"]);

    const towns = d3.selectAll("#townGroup").selectAll("path");
    const townsTooltip = towns.selectAll("title");

    towns.attr("fill", (d) => {
        const country = d.properties.COUNTYNAME.replace("臺", "台");
        const town = d.properties.TOWNNAME.replace("臺", "台");
        const cases = countConfirmed(country, town, dateNum);

        return colorScale(Math.log(cases) / Math.log(10));
    });
    townsTooltip.text((d) => {
        const country = d.properties.COUNTYNAME.replace("臺", "台");
        const town = d.properties.TOWNNAME.replace("臺", "台");
        const cases = countConfirmed(country, town, dateNum);

        return `${dateNum}-${country}-${town}: ${cases} cases in 7 days`;
    });
}

function updateLineChart(country = "全國", town = "全區") {
    d3.select("#taiwan-line-chart-title").text(`Line Chart - ${country} - ${town}`);

    const data = newConfirmed(country, town, dateNum);
    const duration = 200;
    const margin = { top: 10, right: 30, bottom: 30, left: 60 };
    const lineChart = d3.select("svg#taiwan-line-chart"),
        width = +lineChart.attr("width") - margin.right - margin.left,
        height = +lineChart.attr("height") - margin.top - margin.bottom;

    const g = lineChart.selectAll("g");
    const x = d3
        .scaleTime()
        .domain(
            d3.extent(data, function (d) {
                return d.date;
            }),
        )
        .range([0, width]);
    g.selectAll("#xAxis").transition().duration(duration).call(d3.axisBottom(x));

    const y = d3
        .scaleSymlog()
        .domain(
            d3.extent(data, function (d) {
                return d.new;
            }),
        )
        .range([height, 0]);
    g.selectAll("#yAxis").transition().duration(duration).call(d3.axisLeft(y));

    g.selectAll("#lines")
        .datum(data)
        .transition()
        .duration(duration)
        .attr("fill", "none")
        .attr("stroke", "#69b3a2")
        .attr("stroke-width", 1.5)
        .attr(
            "d",
            d3
                .line()
                .x(function (d) {
                    return x(d.date);
                })
                .y(function (d) {
                    return y(d.new);
                }),
        );

    const circle = g.selectAll("#dots").selectAll("circle").data(data);

    circle
        .enter()
        .append("circle")
        .merge(circle)
        .transition()
        .duration(duration)
        .attr("cx", function (d) {
            return x(d.date);
        })
        .attr("cy", function (d) {
            return y(d.new);
        })
        .attr("r", 5)
        .attr("fill", "#69b3a2");
}

function updateLineCharts() {
    const duration = 200;
    const margin = { top: 10, right: 30, bottom: 30, left: 60 };
    const lineCharts = d3.select("svg#taiwan-line-charts"),
        width = +lineCharts.attr("width") - margin.right - margin.left,
        height = +lineCharts.attr("height") - margin.top - margin.bottom;

    const activeTowns = d3.selectAll("#townGroup").selectAll("path[active='true']");
    const dataReady = activeTowns.data().map(d => {
        const country = d.properties.COUNTYNAME.replace("臺", "台");
        const town = d.properties.TOWNNAME.replace("臺", "台");
        return {
            location: `${country} - ${town}`,
            values: newConfirmed(country, town, dateNum)
        };
    });
    if (dataReady.length == 0) {
        dataReady.push({
            location: "全國 - 全區",
            values: newConfirmed("全國", "全區", dateNum)
        });
    }
    
    const locations = Object.keys(data).map(country => {
        return Object.keys(data[country]).map(town => `${country} - ${town}`);
    }).flat();
    const color = d3.scaleOrdinal()
        .domain(locations)
        .range(d3.schemeSet2);

    const g = lineCharts.selectAll("g");

    const x = d3
        .scaleTime()
        .domain(d3.extent(dataReady.map(data => data.values.map(d => d.date)).flat()))
        .range([0, width]);
    g.selectAll("#xAxis").transition().duration(duration).call(d3.axisBottom(x));

    const y = d3
        .scaleSymlog()
        .domain(d3.extent(dataReady.map(data => data.values.map(d => d.new)).flat()))
        .range([height, 0]);
    g.selectAll("#yAxis").transition().duration(duration).call(d3.axisLeft(y));
    
    g.selectAll("path").remove();
    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.new));
    g.selectAll("#lines").selectAll("myLines")
        .data(dataReady)
        .join("path")
            .transition()
            .duration(duration)
            .attr("fill", "none")
            .attr("stroke", d => color(d.location))
            .attr("stroke-width", 3)
            .attr("d", d => line(d.values));

    g.selectAll("circle").remove();
    g.selectAll("#dots").selectAll("myDots")
        .data(dataReady)
        .join("g")
            .style("fill", d => color(d.location))
        .selectAll("myPoints")
        .data(d => d.values)
        .join("circle")
            .attr("cx", d => x(d.date))
            .attr("cy", d => y(d.new))
            .attr("r", 5)
            .attr("stroke", "white")

    g.selectAll("#labels").selectAll("g").remove();
    g.selectAll("#labels").selectAll("myLabels")
        .data(dataReady)
        .join("g")
            .append("text")
            .datum(d => { return {location: d.location, value: d.values[d.values.length - 2]}; }) // keep only the last value of each time series
            .attr("transform",d => `translate(${x(d.value.date)},${y(d.value.new)})`) // Put the text at the position of the last point
            .attr("x", 12) // shift the text a bit more right
            .text(d => d.location)
            .style("fill", d => color(d.location))
            .style("font-size", 20)
}

function update() {
    updateMapChart();
    updateLineChart();
    updateLineCharts();
}

export function draw(d) {
    data = d;
    drawMapChart();
    drawLineChart();
    drawLineCharts();

    // Select dataset
    d3.select("#dataset").on("change", changeDataset);
    update();
}
