var data

// set the dimensions and margins of the graph
var width = 1240
var height = 700

// append the svg object to the body of the page
var svg, svg1

d3.csv('js/m05_clean.csv', conversor)
  .then(function(rows){
    data = rows

    init_vis()
    draw_heatmap()
    draw_histogram()
  })

function conversor(d){
  return {
    date: d.recorded_at,
    bandwidth: +d.bandwidth,
    offset: +d.offset
  }
}


function init_vis(){
  svg =  d3.select("#heatmap")
          .append("svg")
            .attr("width", width)
            .attr("height", height)
          .append("g")
            .attr("width", width)
            .attr("height", height)

  svg1 =  d3.select("#histogram")
          .append("svg")
            .attr("width", width)
            .attr("height", height/5)
          .append("g")
            .attr("width", width)
            .attr("height", height/5)
}


function draw_heatmap(){

  var colorBar = d3.scaleLinear()
    .range(["yellow", "red"])
    .domain([d3.min(data, d=>d.bandwidth), d3.max(data, d=>d.bandwidth)])
  
  var x = d3.scaleBand()
    .range([0,width], 0.5)
    .domain(data.map(d => d.date));

  heatmap = svg
    .append("g")
    .selectAll("bar")
    .data(data)
    .enter().append("rect")
    .style("fill", d => colorBar(d.bandwidth))
    .attr("x", d => x(d.date))
    .attr("y", d => d.offset * 100)
    .attr("width", 1)
    .attr("height", 50)

  labels = svg
    .append("g")
    .selectAll("labels")
    .data([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5])
    .enter().append("text")
    .text(d => d+" seg.")
    .attr("x", 10)
    .attr("y", d => d * 100 + 25)
}

function draw_histogram(){

  var y = d3.scaleLinear()
    .range([0,height/5])
    .domain([d3.min(data, d=>d.bandwidth), d3.max(data, d=>d.bandwidth)])
  
  var x = d3.scaleBand()
    .range([0,width], 0.5)
    .domain(data.map(d => d.date));

  histogram = svg1
    .append("g")
    .selectAll("hist")
    .data(data)
    .enter().append("rect")
    .style("fill","black")
    .attr("x", d => x(d.date))
    .attr("y", d => height/5 - y(d.bandwidth))
    .attr("width", 1)
    .attr("height", d => y(d.bandwidth))
}