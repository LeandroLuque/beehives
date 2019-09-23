// Scatterplot matrix: https://www.d3-graph-gallery.com/graph/correlogram_histo.html

var data, weather

// Dimension of the whole chart. Only one size since it has to be square
var marginWhole = {top: 10, right: 100, bottom: 10, left: 100},
    sizeWhole = screen.height - marginWhole.left - marginWhole.right

// Create the svg area
var svg = d3.select("#my_dataviz")
  .append("svg")
    .attr("width", screen.width)
    .attr("height", screen.height)
  .append("g")
    .attr("transform", "translate(" + marginWhole.left + "," + marginWhole.top + ")");

var slider = svg.append("g")
    .attr("class", "slider")
    .attr("transform", "translate(" + 20 + "," + 900 + ")");


Promise.all([
    d3.csv("data/export_muf.csv",conversor),
    d3.csv("data/full_weather.csv")
  ]).then(function(files) {

  data = files[0].slice(-15000)
  weather = files[1]

  // What are the numeric variables in this dataset? How many do I have
  var allVar = ["bandwidth", "spectralCentroid", "peakFrequency", "rootVarienceFrequency"]
  var numVar = allVar.length

  // Now I can compute the size of a single chart
  mar = 20
  size = sizeWhole / numVar


  // ----------------- //
  // Scales
  // ----------------- //

  // Create a scale: gives the position of each pair each variable
  var position = d3.scalePoint()
    .domain(allVar)
    .range([0, sizeWhole-size])

  // ------------------------------- //
  // Add charts
  // ------------------------------- //

  for (i in allVar){
    for (j in allVar){

      // Get current variable name
      var var1 = allVar[i]
      var var2 = allVar[j]

      // If var1 == var2 i'm on the diagonal, I skip that
      if (var1 === var2 || j < i) { continue; }

      // Add X Scale of each graph
      xextent = d3.extent(data, function(d) { return +d[var1] })
      var x = d3.scaleLinear()
        .domain(xextent).nice()
        .range([ 0, size-2*mar ]);

      // Add Y Scale of each graph
      yextent = d3.extent(data, function(d) { return +d[var2] })
      var y = d3.scaleLinear()
        .domain(yextent).nice()
        .range([ size-2*mar, 0 ]);

      // Add a 'g' at the right position
      var tmp = svg
        .append('g')
        .attr("transform", "translate(" + (position(var1)+mar) + "," + (position(var2)+mar) + ")");

      // Add X and Y axis in tmp
      tmp.append("g")
        .attr("transform", "translate(" + 0 + "," + (size-mar*2) + ")")
        .call(d3.axisBottom(x).ticks(3));
      tmp.append("g")
        .call(d3.axisLeft(y).ticks(3));

      // Add circle
      tmp
        .selectAll("circles")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "circles")
        .attr("cx", function(d){ return x(+d[var1]) })
        .attr("cy", function(d){ return y(+d[var2]) })
        .attr("r", 3)

    }
  }

  for (i in allVar){
    for (j in allVar){

      // variable names
      var var1 = allVar[i]
      var var2 = allVar[j]

      // If var1 == var2 i'm on the diagonal, otherwisee I skip
      if (i != j) { continue; }

      // create X Scale
      xextent = d3.extent(data, function(d) { return +d[var1] })
      var x = d3.scaleLinear()
        .domain(xextent).nice()
        .range([ 0, size-2*mar ]);

      // Add a 'g' at the right position
      var tmp = svg
        .append('g')
        .attr("transform", "translate(" + (position(var1)+mar) + "," + (position(var2)+mar) + ")");

      // Add x axis
      tmp.append("g")
        .attr("transform", "translate(" + 0 + "," + (size-mar*2) + ")")
        .call(d3.axisBottom(x).ticks(3));

      // set the parameters for the histogram
       var histogram = d3.histogram()
           .value(function(d) { return +d[var1]; })   // I need to give the vector of value
           .domain(x.domain())  // then the domain of the graphic
           .thresholds(x.ticks(15)); // then the numbers of bins

       // And apply this function to data to get the bins
       var bins = histogram(data);

       // Y axis: scale and draw:
       var y = d3.scaleLinear()
            .range([ size-2*mar, 0 ])
            .domain([0, d3.max(bins, function(d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously

       // append the bar rectangles to the svg element
       tmp.append('g')
          .selectAll("rect")
          .data(bins)
          .enter()
          .append("rect")
             .attr("x", 1)
             .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
             .attr("width", function(d) { return x(d.x1) - x(d.x0)  ; })
             .attr("height", function(d) { return (size-2*mar) - y(d.length); })
             .style("fill", "#b8b8b8")
             .attr("stroke", "white")
    }
  }


  var brush = d3.brushX()
    .extent([
        [0, 0],
        [900, 100]
    ])
    .on("brush end", brushed);

  var xScale2 = d3.scaleTime()
    .range([0,900], 0.5)
    .domain([new Date("2019-03-25 00:00:00"), new Date("2019-08-08 00:00:00")]);
  
  var yScale2 = d3.scaleLinear().range([100, 0]).domain([0, 100]);

  var sliderdots = slider.append("g");


  var line = (y_scale) => d3.line()
    .curve(d3.curveBasis)
    .x(function(d) { return xScale2(new Date(d.x));})
    .y(function(d) { return yScale2(d.y); });


  sliderdots.selectAll("dot")
      .data(weather)
      .enter().append("path")
      .attr('class', 'dotslider')
      .attr("d", line(y)(weather.map(l => ({x: l.date, y: l.Favg}))))
      .style("fill","none")
      .attr("stroke", "red")
      .attr("stoke-width", 3)

  slider.append("g")
        .attr("class", "brush")
        .call(brush)
        .call(brush.move, xScale2.range());

  function brushed() {
    var selection = d3.event.selection;

    if (selection !== null) {
        var e = d3.event.selection.map(xScale2.invert, xScale2);

        var test2 = svg.selectAll(".circles");
        test2.style("opacity", function (d) {
            var date = new Date(d.date.split(" ").slice(0,2).join(" "))
            return (e[0] <= date && date <= e[1])?1:0;
        })
    }
  }

})


function conversor(d){
  return {
    date: d.recorded_at,
    bandwidth: +d.bandwidth,
    peakFrequency: +d.peakFrequency,
    spectralCentroid: +d.spectralCentroid,
    rootVarienceFrequency: +d.rootVarienceFrequency
  }
}




