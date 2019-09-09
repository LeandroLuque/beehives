var data, data1, data2, weather

// set the dimensions and margins of the graph
var width = 1240
var height = 700

// append the svg object to the body of the page
var svg, svg1

Promise.all([
    d3.csv("data/export_m05.csv", conversor),
    d3.csv("data/export_muf.csv", conversor),
    d3.csv("data/export_m01.csv", conversor),
    d3.csv("data/full_weather.csv")
]).then(function(files){
  data1 = files[0].filter(l => l.offset == 0 && l.date >= '2019-03-26 22:03:22 +0100')
  data = files[1].filter(l => l.offset == 0 && l.date >= '2019-03-26 22:03:22 +0100')
  data2 = files[2].filter(l => l.offset == 0 && l.date >= '2019-03-26 22:03:22 +0100')
  weather = files[3]

  init_vis()
  draw_heatmap()
  //draw_histogram()
  //draw_linechart()
  draw_weather()
})


function conversor(d){
  return {
    date: d.recorded_at,
    bandwidth: +d.bandwidth,
    offset: +d.offset,
    peakFrequency: +d.peakFrequency,
    spectralCentroid: +d.spectralCentroid,
    rootVarienceFrequency: +d.rootVarienceFrequency
  }
}

function init_vis(){
  svg =  d3.select("#heatmap")
          .append("svg")
            .attr("width", width)
            .attr("height", height)
            // .call(d3.zoom().on("zoom", function () {
            //    svg.attr("transform", d3.event.transform)
            // }))
          .append("g")
            .attr("width", width)
            .attr("height", height)

  svg1 =  d3.select("#histogram")
          .append("svg")
            .attr("width", width)
            .attr("height", height/2)
          .append("g")
            .attr("width", width)
            .attr("height", height/2)

  var colorBar1 = (min, max) => d3.scaleLinear()
              .range(["yellow", "red"])
              .domain([min, max])


  d3.select("#options")
    .on("change", function(d){

      var option = d3.select(this).property("value")

      var max_v = d3.max([data, data1, data2], function(d){return d3.max(d, l => l[option])})
      var min_v = d3.min([data, data1, data2], function(d){return d3.min(d, l => l[option])})
      
      console.log(min_v, max_v)


      let c = colorBar1(min_v, max_v)

      d3.map([heatmap_muf, heatmap_m01, heatmap_m05], selector =>

          selector
            .transition()
            .duration(100)
            .style("fill", d => c(d[option]))
        )
    })

}


function draw_heatmap(){

  var colorBar = d3.scaleLinear()
    .range(["yellow", "red"])
    .domain([1, 10000])

  var x = d3.scaleTime()
    .range([0,width], 0.5)
    .domain([new Date("2019-03-26 09:01:42"), new Date("2019-08-07 10:50:03")]);

  heatmap_muf = svg
    .append("g")
    .selectAll("bar")
    .data(data.filter(l => l.offset == 0))
    .enter().append("rect")
    .style("fill", d => colorBar(d.bandwidth))
    .attr("x", d => x(new Date(d.date.split(" ").slice(0,2).join(" "))))
    .attr("y", d => d.offset * 100)
    .attr("width", 1)
    .attr("height", 50)

  heatmap_m05 = svg
    .append("g")
    .selectAll("bar")
    .data(data1.filter(l => l.offset == 0))
    .enter().append("rect")
    .style("fill", d => colorBar(d.bandwidth))
    .attr("x", d => x(new Date(d.date.split(" ").slice(0,2).join(" "))))
    .attr("y", d => 50)
    .attr("width", 1)
    .attr("height", 50)

  heatmap_m01 = svg
    .append("g")
    .selectAll("bar")
    .data(data2.filter(l => l.offset == 0))
    .enter().append("rect")
    .style("fill", d => colorBar(d.bandwidth))
    .attr("x", d => x(new Date(d.date.split(" ").slice(0,2).join(" "))))
    .attr("y", d => 100)
    .attr("width", 1)
    .attr("height", 50)

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
}


function draw_linechart(){

  var x = d3.scaleBand()
    .range([0,width], 0.5)
    .domain(data.map(d => d.date));

  var y = d3.scaleLinear()
    .range([50,0])
    .domain([d3.min(data.filter(l => l.offset == 0), d=>d.rootVarienceFrequency), d3.max(data.filter(l => l.offset == 0), d=>d.rootVarienceFrequency)])

  var line = d3.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.rootVarienceFrequency); });


  trajectories = svg
    .append("g")
    .selectAll("path")
    .data(data.filter(l => l.offset == 0))
    .enter().append("path")
    .attr("d", d => line(data.filter(l => l.offset == 0)))
    .attr("fill", "none")
    .attr("stroke", "black")
}


function draw_histogram(){

  var y = d3.scaleLinear()
    .range([0,height/5])
    .domain([d3.min(data, d=>d.spectralCentroid), d3.max(data, d=>d.spectralCentroid)])
  
  var x = d3.scaleBand()
    .range([0,width], 0.5)
    .domain(data.map(d => d.date));

  histogram = svg1
    .append("g")
    .selectAll("hist")
    .data(data)
    .enter().append("rect")
    .style("fill","gray")
    .attr("x", d => x(d.date))
    .attr("y", d => height/5 - y(d.spectralCentroid))
    .attr("width", 1)
    .attr("height", d => y(d.spectralCentroid))
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
    .attr("d", line(y)(weather.map(l => ({x: l.Date, y: l.Favg}))))
    .style("fill","none")
    .attr("stroke", "red")
    .attr("stoke-width", 3)

  rain_plot = svg1
    .append("g")
    .selectAll("temp")
    .data(weather)
    .enter().append("path")
    .attr("d", line(y1)(weather.map(l => ({x: l.Date, y: l.Ravg}))))
    .style("fill","none")
    .attr("stroke", "blue")
    .attr("stoke-width", 3)

  svg1.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(30,0)")
      .call(d3.axisLeft(y));

  svg1.append("g")
      .attr("class", "axis")
      .attr("transform", "translate("+(width-10)+",0)")
      .call(d3.axisLeft(y1));



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