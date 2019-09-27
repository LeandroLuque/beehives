var data, data1, data2, weather, starLines, canvas=null, context,
    avg_shape, d1_shape, d2_shape

// set the dimensions and margins of the graph
var width = 1240
var height = 700

// append the svg object to the body of the page
var svg, svg1

var fake_state

Promise.all([
    // d3.csv("data/export_m05.csv", conversor),
    // d3.csv("data/export_muf.csv", conversor),
    // d3.csv("data/export_m01.csv", conversor),
    d3.csv("data/m05_filtrado.csv", conversor),
    d3.csv("data/muf_filtrado.csv", conversor),
    d3.csv("data/m01_filtrado.csv", conversor),
    d3.csv("data/full_weather.csv", conversor1)
])
.then(function(files){
  data1 = files[0].filter(l => l.date >= '2019-03-26 22:03:22 +0100')
  data = files[1].filter(l => l.date >= '2019-03-26 22:03:22 +0100')
  data2 = files[2].filter(l => l.date >= '2019-03-26 22:03:22 +0100')
  weather = files[3]

  fake_state = Object({"muf":data, "m05":data1, "m01":data2});

  init_vis()
  draw_heatmap()
  draw_axis_heatmap()
  draw_weather()
  draw_starplot(data)
})

function conversor1(d){
  return {
    date: d.date,
    Favg: +d.Favg,
    Ravg: +d.Ravg
  }
}

function conversor(d){
  return {
    date: d.recorded_at,
    bandwidth: +d.bandwidth,
    offset: +d.offset,
    peakFrequency: +d.peakFrequency,
    spectralCentroid: +d.spectralCentroid,
    rootVarienceFrequency: +d.rootVarienceFrequency,
    coeff_h: +d.coeff_h,
    coeff_l: +d.coeff_l,
    coeff_full: +d.coeff_full
  }
}

function init_vis(){
  svg =  d3.select("#heatmap")
          .append("svg")
            .attr("width", width)
            .attr("height", height/2)
            .style("position", "absolute")
            .style("left", "9px")
          .append("g")
            .attr("width", width)
            .attr("height", height/2)


  svg1 =  d3.select("#histogram")
          .append("svg")
            .attr("width", width)
            .attr("height", height/2)
          .append("g")
            .attr("width", width)
            .attr("height", height/2)

  svg2 =  d3.select("#starplot")
          .append("svg")
            .attr("width", width)
            .attr("height", height)
          .append("g")
            .attr("width", width)
            .attr("height", height)
            .attr("transform", "translate(" + width/3 + "," + height/2 + ")");

  d3.select("#options")
    .on("change", function(d){
      var option = d3.select(this).property("value")
      draw_heatmap(option)
    })

  d3.select("#datasets")
    .on("change", function(d){
      var option = d3.select(this).property("value")
      starLines.remove()
      avg_shape.remove()
      d1_shape.remove()
      d2_shape.remove()
      draw_starplot(fake_state[option])
    })
}

function draw_heatmap(feature="spectralCentroid"){

  var colorBars = {}

  for (i in fake_state){
    colorBars[i] = d3.scaleLinear()
    .range(["yellow", "red"])
    .domain([0, d3.max(fake_state[i], l => l[feature])])
  }

  var x = d3.scaleTime()
    .range([0,width], 0.5)
    .domain([new Date("2019-03-26 09:01:42"), new Date("2019-08-07 10:50:03")]);

  canvas = canvas ? d3.select("#canvas"):d3.select("#heatmap").append("canvas")
    .attr("id", "canvas")
    .attr("width", width)
    .attr("height", 150)

  context = canvas.node().getContext("2d")

  context.clearRect(0, 0, width, 150);

  Object.entries(fake_state).forEach((d, i) => {
    d[1].forEach(function(l){
      context.fillStyle = colorBars[d[0]](l[feature]);
      context.fillRect(x(new Date(l.date.split(" ").slice(0,2).join(" "))), 50 * i, 1, 50);
  });

  })
}

function draw_weather(){

  y = d3.scaleLinear()
    .range([height/2,0])
    .domain([0, 100])

  y1 = d3.scaleLinear()
    .range([height/2,0])
    .domain([0, 1])
  
  x = d3.scaleTime()
    .range([0,width], 0.5)
    .domain([new Date("2019-03-26 09:01:42"), new Date("2019-08-07 10:50:03")]);

  var line = (y_scale) => d3.line()
    .curve(d3.curveBasis)
    .x(function(d) { return x(new Date(d.x))})
    .y(function(d) { return y_scale(d.y); });

  weather_plot = svg1
    .append("g")
    .selectAll("temp")
    .data(weather)
    .enter().append("path")
    .attr("d", line(y)(weather.map(l => ({x: l.date, y: l.Favg}))))
    .style("fill","none")
    .attr("stroke", "red")
    .attr("stoke-width", 3)

  rain_plot = svg1
    .append("g")
    .selectAll("temp")
    .data(weather)
    .enter().append("path")
    .attr("d", line(y1)(weather.map(l => ({x: l.date, y: l.Ravg}))))
    .style("fill","none")
    .attr("stroke", "blue")
    .attr("stoke-width", 3)

  svg1.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(40,0)")
      .call(d3.axisLeft(y).tickFormat((d, i) => d + "°F"));

  svg1.append("g")
      .attr("class", "axis")
      .attr("transform", "translate("+(width-5)+",0)")
      .call(d3.axisLeft(y1).tickFormat((d, i) => d + "in"));

  /// Legend  
  var size = 20
  svg1.selectAll("mydots")
    .data([["Temperature (°F)",'red'], ["Rain (in)",'blue']])
    .enter()
    .append("rect")
      .attr("x", 80)
      .attr("y", function(d,i){ return 50 + i*(size+5)})
      .attr("width", size)
      .attr("height", size)
      .style("fill", d => d[1])

  svg1.selectAll("mylabels")
    .data([["Temperature (°F)",'red'], ["Rain (in)",'blue']])
    .enter()
    .append("text")
      .attr("x", 80 + size*1.2)
      .attr("y", function(d,i){ return 50 + i*(size+5) + (size/2)})
      .style("fill", d => d)
      .text(d => d[0])
      .attr("text-anchor", "left")
}

function draw_starplot(plotdata){

  const HALF_PI = Math.PI / 2;

  const radius = 300;

  const angleSlice = Math.PI * 2 / 7

  const axes = ["peakFrequency", "bandwidth", "rootVarienceFrequency", "spectralCentroid", "coeff_h", "coeff_l", "coeff_full"]
  
  let values = axes.map(l => d3.mean(plotdata, d => d[l]))

  let average_shape = {};
  axes.forEach((key, i) => average_shape[key] = values[i]);

  let deviation1_shape = {};
  axes.forEach(function (key, i) {
    deviation1_shape[key] = average_shape[key] + 1*d3.deviation(plotdata, l => l[key])
  })

  let deviation2_shape = {};
  axes.forEach(function (key, i) {
    deviation2_shape[key] = average_shape[key] - 1*d3.deviation(plotdata, l => l[key])
  })

  const axes_values = axes.map(l => ({axis: l , value: d3.max(plotdata, s => s[l])}))

  scales = {}
  for (let i in axes_values) {
    scales[axes_values[i].axis] = d3.scaleLinear()
      .range([0, radius])
      .domain([0, axes_values[i].value]).clamp(true)
  } 

  const radarLine = d3.radialLine()
    .curve(d3.curveLinearClosed)
    .radius(d => d)
    .angle((d,i) => i * angleSlice);

  radarLine.curve(d3.curveCardinalClosed)

  starLines = svg2.selectAll(".radarWrapper")
    .remove().exit()
    .data(plotdata)
    .enter().append("path")
    .attr("class", "radarArea")
    .attr("d", d => radarLine(axes.map(l => d[l] = scales[l](d[l]))))
    .style("fill", "none")
    .style("stroke", "pink")
    .style("opacity", "0.3")

  avg_shape = svg2.selectAll(".avg")
    .remove().exit()  
    .data([average_shape]).enter()
    .append("path")
    .attr("class", "radarArea")
    .attr("d", d => radarLine(axes.map(l => d[l] = scales[l](d[l]))))
    .style("fill", "none")
    .style("stroke", "red")
    .style("stroke-width", 3)

  d1_shape = svg2.selectAll(".avg")
    .remove().exit()
    .data([deviation1_shape]).enter()
    .append("path")
    .attr("class", "radarArea")
    .attr("d", d => radarLine(axes.map(l => d[l] = scales[l](d[l]))))
    .style("fill", "none")
    .style("stroke", "red")
    .style("stroke-width", 3)
    .style("stroke-dasharray", ("3, 3"))

  d2_shape = svg2.selectAll(".avg")
    .remove().exit()
    .data([deviation2_shape]).enter()
    .append("path")
    .attr("class", "radarArea")
    .attr("d", d => radarLine(axes.map(l => d[l] = scales[l](d[l]))))
    .style("fill", "none")
    .style("stroke", "red")
    .style("stroke-width", 3)
    .style("stroke-dasharray", ("3, 3"))

  //Draw axis
  var axis = svg2.selectAll(".axis")
    .remove().exit()
    .data(axes_values)
    .enter()
    .append("g")
    .attr("class", "axis");

  //Append the lines
  axis.append("line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", (d, i) => radius * Math.cos(angleSlice * i - HALF_PI))
    .attr("y2", (d, i) => radius * Math.sin(angleSlice * i - HALF_PI))
    .attr("class", "line")
    .style("stroke", "gray")
    .style("opacity", "0.5")
    .style("stroke-width", "2px");

  axis.append("text")
    .attr("class", "legend")
    .style("font-size", "11px")
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .attr("x", (d,i) => radius * Math.cos(angleSlice * i - HALF_PI))
    .attr("y", (d,i) => radius * Math.sin(angleSlice * i - HALF_PI))
    .text(d => d.axis)
    .attr("font-size", "20px")
}

function draw_axis_heatmap(){

  var x = d3.scaleTime()
    .range([0,width], 0.5)
    .domain([new Date("2019-03-26 09:01:42"), new Date("2019-08-07 10:50:03")]);

  labels = svg
    .append("g")
    .selectAll("labels")
    .data([['muf', 0], ['m05', 0.5],['m01', 1]])
    .enter().append("text")
    .text(d => d[0])
    .attr("x", 10)
    .attr("y", d => d[1] * 100 + 25)


  svg.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0,150)")
      .call(d3.axisBottom(x)
              .tickFormat(d3.timeFormat("%Y-%m-%d")))
      .selectAll("text")  
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)");

  var brush = d3.brushX()
    .extent([
        [0, 0],
        [width, 150]
    ])
    .on("brush end", brushed)

  function brushed() {
      var selection = d3.event.selection;

      if (selection !== null) {
          var e = d3.event.selection.map(x.invert, x);

          if (starLines == null)
            return

          starLines.style("opacity", function(d){
            var date = new Date(d.date.split(" ").slice(0,2).join(" "))
            return (e[0] <= date && date <= e[1])?1:0;
          })
      }
  }

  svg.append("g")
    .attr("class", "brush")
    .call(brush)
    .call(brush.move, x.range())
}
