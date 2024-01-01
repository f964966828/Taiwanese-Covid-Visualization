// The svg
const svg = d3.select("svg"),
  width = +svg.attr("width"),
  height = +svg.attr("height");

// Append a rectangle to act as a border
svg
  .append("rect")
  .attr("width", width)
  .attr("height", height)
  .style("fill", "none") // No fill color
  .style("stroke", "black") // Border color
  .style("stroke-width", "2px"); // Border width

// Create a group element to contain the map
const townGroup = svg.append("g").attr("id", "townGroup");
const countryGroup = svg.append("g").attr("id", "countryGroup");

// Map and projection
const projection = d3
  .geoMercator()
  .center([121, 23.7]) // 中心的經緯度
  .scale(10000) // zoom parameter
  .translate([width / 2, height / 2]);
const pathGenerator = d3.geoPath().projection(projection);

// Define zoom behavior
const zoom = d3
  .zoom()
  .scaleExtent([1, 8])
  .on("zoom", (event) => {
    townGroup.attr("transform", event.transform);
    countryGroup.attr("transform", event.transform);
  });

function resetZoom() {
  svg
    .transition()
    .duration(750) // Smooth transition
    .call(zoom.transform, d3.zoomIdentity); // Reset zoom
}

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

function drawLineChart() {
  const margin = { top: 10, right: 30, bottom: 30, left: 60 };
  const lineChart = d3.select("svg#taiwan-line-chart"),
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

function updateLineChart(country, town, data) {
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
        console.log(d);
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

function draw_town(data) {
  /*const colorScaleConfirm = d3.linear()
        .domain([])
        .range(["gray", "red"])*/

  d3.json("./TopoJSON/TOWN_MOI_1120825.json").then((topoJsonData) => {
    // Convert from TopoJSON to GeoJSON
    const geometries = topojson.feature(
      topoJsonData,
      topoJsonData.objects["TOWN_MOI_1120825"],
    );

    // 給定區域，計算近七天的確診人數(原資料會有缺失值)
    function countConfirmed(country, town, t) {
      const arr = data[country][town].confirmed.map(
        (d) => +d["個案研判日"].replaceAll("-", ""),
      );

      // upper index (now)
      const upperIdx = arr.length - d3.bisectRight(arr.slice().reverse(), t);
      if (upperIdx == arr.length) {
        // no one confirmed
        return 0;
      }

      // lower index (now)
      const last7_day = numToDate(t, -7);
      const last7_t = dateToNum(last7_day);
      const lowerIdx =
        arr.length - d3.bisectRight(arr.slice().reverse(), last7_t);

      // compute cases
      if (lowerIdx == arr.length) {
        const upper = +data[country][town].confirmed[upperIdx]["累計確診人數"];
        return upper;
      } else {
        const upper = +data[country][town].confirmed[upperIdx]["累計確診人數"];
        const lower = +data[country][town].confirmed[lowerIdx]["累計確診人數"];
        return upper - lower;
      }
    }

    function newConfirmed(country, town, t) {
      const arr = data[country][town].confirmed.map(
        (d) => +d["個案研判日"].replaceAll("-", ""),
      );

      // lower index (now)
      const last7_day = numToDate(t, -7);
      const last7_t = dateToNum(last7_day);
      const lowerIdx =
        arr.length - d3.bisectRight(arr.slice().reverse(), last7_t);

      var index = Math.min(lowerIdx - 1, arr.length - 1);
      var newConfirmedArr = [];

      for (let offset = -7 + 1; offset <= 0; offset++) {
        const curDay = numToDate(t, offset);
        const curT = dateToNum(curDay);
        if (arr[index] === curT) {
          newConfirmedArr.push({
            new: +data[country][town].confirmed[index]["新增確診人數"],
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
        for (let d of data[country][town].confirmed) {
          confirmedMax = Math.max(
            confirmedMax,
            Math.round(
              Math.log(d["七天移動平均新增確診人數"] * 7) / Math.log(10),
            ),
          );
        }
      }
    }
    //console.log(confirmedMax);

    // compute time range
    let timeMin = 90121231;
    let timeMax = 0;
    for (let country of Object.keys(data)) {
      if (country == "全國") {
        continue;
      }
      for (let d of data[country]["全區"].confirmed) {
        const t = +d["個案研判日"].replaceAll("-", "");
        timeMax = Math.max(timeMax, t);
        timeMin = Math.min(timeMin, t);
      }
    }
    // console.log(timeMin);
    // console.log(timeMax);

    // color scale
    const colorScale = d3
      .scaleLinear()
      .domain([0, confirmedMax])
      .range(["#ffffff", "#ff0000"]);

    // Draw the map
    const towns = townGroup
      .selectAll("path")
      .data(geometries.features)
      .join("path")
      .attr("fill", (d) => {
        const country = d.properties.COUNTYNAME.replace("臺", "台");
        const town = d.properties.TOWNNAME.replace("臺", "台");
        return colorScale(
          Math.log(countConfirmed(country, town, 20200128)) / Math.log(10),
        );
      })
      .attr("d", pathGenerator)
      .style("stroke", "none");

    const townsTooltip = towns.append("title").text((d) => {
      const country = d.properties.COUNTYNAME.replace("臺", "台");
      const town = d.properties.TOWNNAME.replace("臺", "台");
      return `20200128-${country}-${town}: ${countConfirmed(
        country,
        town,
        20200128,
      )} cases in 7 days`;
    });

    // draw slider
    function draw_slider() {
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
          const dateNum = dateToNum(numToDate(20200128, val));
          towns.attr("fill", (d) => {
            const country = d.properties.COUNTYNAME.replace("臺", "台");
            const town = d.properties.TOWNNAME.replace("臺", "台");
            const cases = countConfirmed(country, town, dateNum);
            newConfirmed(country, town, dateNum);

            return colorScale(Math.log(cases) / Math.log(10));
          });
          townsTooltip.text((d) => {
            const country = d.properties.COUNTYNAME.replace("臺", "台");
            const town = d.properties.TOWNNAME.replace("臺", "台");
            const cases = countConfirmed(country, town, dateNum);

            return `${dateNum}-${country}-${town}: ${cases} cases in 7 days`;
          });
          updateLineChart(
            "全國",
            "全區",
            newConfirmed("全國", "全區", dateNum),
          );
        });

      // draw slider
      svg
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

    draw_slider();
    drawLineChart();
    updateLineChart("全國", "全區", newConfirmed("全國", "全區", 20200128));
  });
}

function draw_country(data) {
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

export function draw(data) {
  // Apply zoom behavior to the SVG
  svg.call(zoom);

  // Set reset button function
  d3.select("#zoom-reset-button").on("click", resetZoom);

  draw_town(data);
  draw_country(data);
}
