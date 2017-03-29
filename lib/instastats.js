/*

Author      : Keith Ng (@keith_ng)
Created     : 27-03-2017
Licence     : MIT Licence
Description : Drop-in d3.js visualisations for the StatsNZ Time Series API Prototype (https://statisticsnz.portal.azure-api.net/docs/services/57f1bb499726321dd478b1c7/operations/57f1bb4b97263203c870fa35)
Libraries   : Requires d3 (v4), Underscore, jQuery

*/

var HOST = "https://statisticsnz.azure-api.net/data/"

// Hardcoded because there's no discovery API
// ...also there are no descriptions for any of these subjects
var SUBJECTS = [
  { id : "alc", title : "alc" },
  { id : "bop", title : "bop" },
  { id : "bpi", title : "bpi" },
  { id : "crt", title : "crt" },
  { id : "esm", title : "esm" },
  { id : "gdp", title : "gdp" },
  { id : "gst", title : "gst" },
  { id : "lms", title : "lms" },
  { id : "oti", title : "oti" },
  { id : "rts", title : "rts" },
  { id : "vbw", title : "vbw" },
  { id : "wts", title : "wts" }
]


function InstaStats (opt) {
  var I = this
  I.$   = $(opt.targ)
  I.key = opt.key
  console.log("InstaStats setting up:", opt)

  // Set up div
  I.$.addClass("instastats")
  I.menu    = $("<div/>", { class : "menu"    }).appendTo(I.$)
  I.title   = $("<div/>", { class : "title"   }).appendTo(I.$)
  I.tooltip = $("<div/>", { class : "tooltip" }).appendTo(I.$)
  I.chewy   = $("<div/>", {
    class : "chewy",
    html  : "<a href='http://www.chewydata.com' target='_blank'>Powered by ChewyData</a>"
  }).appendTo(I.$)

  // SVGs must be initialised with width/height because reasons
//   I.cont    = $("<div/>", { class : "container" }).appendTo(I.$)
  I.svg     = $("<svg width='10' height='10'></svg>").appendTo(I.$)

  // Set up SVG
  I.d3      = d3.select(opt.targ + " svg")
  I.graph   = I.d3.append("g").attr("class", "graph")       // Container for graph
  I.xAxis   = I.d3.append("g").attr("class", "x-axis axis") // X axis
  I.yAxis   = I.d3.append("g").attr("class", "y-axis axis") // Y axis
  I.yLabel  = I.yAxis.append("text")
                     .attr("class", "axisLabel")
                     .attr("y", 6)
                     .attr("dy", "0.71em")

  I.d3.on("mousemove", function () { I.highlight(d3.mouse(this)) })

  // Predefined group
  if (opt.group) {
    if (!opt.subject) {
      I.error("Error: Group defined, but not subject! I don't understand which subject this group belongs to.")
    }
    else {
      I.subject = opt.subject
      I.setGroup(opt.group)
    }
  }

  // Predefined subject (but not group)
  else if (opt.subject) {
    I.groups = I.addDropdown("groups", "setGroup")       // Create empty dropdown for groups
    I.setSubject(opt.subject)                            // Set subject and populate groups dropdown
  }

  // Neither are predefined
  else {
    I.subjects = I.addDropdown("subjects", "setSubject") // Create empty dropdown for subjects
    I.groups   = I.addDropdown("groups", "setGroup")     // Create empty dropdown for groups
    // Populate with all known subject
    _.each(SUBJECTS, function (s) {
      $("<option/>", { value : s.id, html : s.title }).appendTo(I.subjects)
    })
    I.setTitle("Select a subject to start")
  }
}


///////////////
//  Display  //
///////////////
// Select a highlight point based on mousePos
InstaStats.prototype.highlight = function (mousePos) {
  var I      = this,
      series = []
  I.graph.selectAll(".series").each(function (d) {
    var path = $(this).find("path")[0],
        p    = closestPoint(path, mousePos)
    if (p.distance <= 10) {
      series.push({
        el   : this,
        data : d,
        px   : p[0],
        py   : p[1],
        dist : p.distance
      })
    }
  })

  var l = _.min(series, "dist") // Get closest series

  // Highlight has changed
  if (l.el != I.highlighted) {
    $(I.highlighted).removeClass("highlighted") // Remove previously highlighted
    I.highlighted = l.el                        // Set new highlighted
  }

  // Update tooltip
  if (I.highlighted) {
    var date = I.xScale.invert(l.px),
        data = _.min(l.data.data, function (d) {
          return Math.abs(d.date - date)
        })
    I.showTooltip([l.px, l.py], data)
    $(".graph").addClass("faded")               // Container is faded
    $(l.el).addClass("highlighted")             // Selected series is highlighted
  }
  else {
    I.hideTooltip()
    $(".graph").removeClass("faded")
  }
}

// Create empty dropdown
InstaStats.prototype.addDropdown = function (className, onChange) {
  var I        = this,
      dropdown = $("<select/>", { class : className })
  dropdown.appendTo(I.menu)
  if (onChange) dropdown.on("change", function (e) {
    I[onChange](e.target.value)
  })
  return dropdown
}

// Display error message
InstaStats.prototype.error = function (msg) {
  console.error(msg)
  this.$.addClass("error").html(msg)
}

// Clear graph and tooltip
InstaStats.prototype.reset = function () {
  this.hideTooltip()
  this.d3.select(".graph")
         .selectAll(".series").remove()
}

// Show loading status
InstaStats.prototype.showSpinner = function () {
  this.setTitle("Loading data...")
  this.$.addClass("loading")
  this.svg.fadeOut()
}

// End loading status
InstaStats.prototype.hideSpinner = function () {
  this.$.removeClass("loading")
  this.svg.stop().fadeIn()
}

// Show tooltip at the current mouse position
InstaStats.prototype.showTooltip = function (pos, data) {
  var tooltip = this.tooltip,
      offset  = this.svg.offset(),
      text    = ""

  console.log("Highlighting:",  data)
  text = [
    data.name + " (" + data.ref + ")",
    data.date.toISOString().substr(0, 7),
    ((data.suppressed) ? "Suppressed" : data.val),
    "Status: " + data.status
  ].join("<br>")

  tooltip.html(text)
         .css("left", pos[0] + offset.left) // Include offset of SVG element
         .css("top", pos[1] + offset.top)   // Include offset of SVG element
         .show()
}

// Hide tooltip
InstaStats.prototype.hideTooltip = function () {
  this.tooltip.fadeOut()
}

// Set title
InstaStats.prototype.setTitle = function (text) {
  this.title.html(text)
}

// Draw d3.js graph
InstaStats.prototype.render = function (group) {
  var I      = this,
      width  = +I.d3.style("width").replace("px", ""),
      height = +I.d3.style("height").replace("px", "")

  if (isNaN(width)) {
    console.log(I.d3, I.d3.style("width"), I.d3.style("height"))
  }

  // D3 components
  var x = I.xScale = d3.scaleTime().rangeRound([0, width]),
      y = I.yScale = d3.scaleLinear().rangeRound([height, 0]),
      getX         = function (d) { return x(d.date) },
      getY         = function (d) { return y(d.val) },
      lineConst    = d3.line().x(getX).y(getY),
      seriesConst  = function (el) {
        // Series container
        var g = el.append("g")
        g.attr("id", function (d) { return d.ref })
         .attr("class", "series")
         .style("stroke", randomColor)
        // Line
        g.append("path")
         .datum(function (d) { return d.data })
         .attr("d", lineConst)
        // Dots
        g.selectAll("circle")
         .data(function (d) { return d.data })
         .enter().append("circle")
           .attr("cx", getX)
           .attr("cy", getY)
      }

  // D3 objects
  var xAxis  = I.d3.select(".x-axis"),
      yAxis  = I.d3.select(".y-axis"),
      graph  = I.d3.select(".graph"),
      yLabel = yAxis.select(".axisLabel")

  console.log("Rendering object:", group)
  I.setTitle(group.name)

  // Update axes
  x.domain(group.extent.date)
  y.domain(group.extent.val).nice()
  xAxis.call(d3.axisBottom(x))
       .attr("transform", "translate(0," + height + ")") // Move to bottom
  yAxis.call(d3.axisLeft(y))
  yLabel.text(group.unit)

  // Create line for each series
  graph.selectAll(".series").remove()
  graph.selectAll(".series")
       .data(group.series)
       .enter().call(seriesConst)

}


////////////
//  Data  //
////////////
// Housekeeping function for API fetches
InstaStats.prototype.fetch = function (url, success, complete) {
  var I = this
  I.showSpinner()
  if (I.ajax) {
    try { I.ajax.abort() }
    catch (err) {}
  }
  I.ajax = $.ajax({
    url      : url,
    headers  : { "Ocp-Apim-Subscription-Key" : I.key },
    success  : success,
    error    : function (res, status) {
      I.error(res.responseJSON.message)
    },
    complete : function () {
      I.hideSpinner()
      I.ajax = null
      if (complete) complete()
    }
  })
}

// Fetches group list for a given subject
InstaStats.prototype.setSubject = function (subject) {
  var I   = this,
      url = HOST + subject + "/v0.1/groups"

  console.log("Setting subject to", subject)
  I.subject = subject
  I.groups.html("")
  I.fetch(url, function (data) {
    _.each(data, function (g) {
      $("<option/>", { value : g, html : g }).appendTo(I.groups)
    })
  })
  I.reset()
  I.setTitle("Select a group to start")
}

// Fetches data for a given group
InstaStats.prototype.setGroup = function (groupName) {
  var I   = this,
      url = HOST + "api/" + I.subject

  console.log("Setting group to", groupName, "in subject", I.subject)
  I.group = groupName
  I.fetch(url, function (data) {
    var group = I.cleanData(groupName, data)
    I.render(group)
  })
}

// Makes data friendlier for datavising
InstaStats.prototype.cleanData = function (groupName, data) {
  var parseDate = d3.timeParse("%Y.%m"),
      extent, series,
      unit = data[0].Unit

  console.log("Cleaning raw data:", data)

  // Filter for groups (API group filtering doesn't work!)
  data = _.filter(data, function (d) {
    if (d.Group != groupName) return false
    if (!d.Period) {
      console.error("No valid period!")
      return false
    }
    return true
  })

  // Type conversions
  data = _.map(data, function (d) {
    d.date = parseDate(d.Period)
    d.val  = d.DataValues * (Math.pow(10, d.Magnitude || 0))
    return d
  })

  // Get extents
  extent = {
    date : d3.extent(data, function(d) { return d.date }),
    val  : d3.extent(data, function(d) { return d.val })
  }

  // Group by SeriesReference
  data = _.groupBy(data, function (d) {
    return d.SeriesReference
  })

  // Reduce all the data for a given SeriesReference to a single object
  series = _.map(data, function (d, SeriesReference) {
    d = _.sortBy(d, "date")
    return {
      ref  : SeriesReference,
      name : d[0].SeriesTitle1,
      data : _.map(d, function (e) {
        return {
          ref        : SeriesReference,
          name       : e.SeriesTitle1,
          date       : e.date,
          val        : e.val,
          status     : e.status,
          suppressed : e.Suppressed
        }
      })
    }
  })

  return {
    name   : groupName,
    unit   : unit,
    extent : extent,
    series : series
  }
}


// From http://bl.ocks.org/jdarling/06019d16cb5fd6795edf
var randomColor = (function(){
  var golden_ratio_conjugate = 0.618033988749895;
  var h = Math.random();

  var hslToRgb = function (h, s, l){
      var r, g, b;

      if(s == 0){
          r = g = b = l; // achromatic
      }else{
          function hue2rgb(p, q, t){
              if(t < 0) t += 1;
              if(t > 1) t -= 1;
              if(t < 1/6) return p + (q - p) * 6 * t;
              if(t < 1/2) return q;
              if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
              return p;
          }

          var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          var p = 2 * l - q;
          r = hue2rgb(p, q, h + 1/3);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1/3);
      }

      return '#'+Math.round(r * 255).toString(16)+Math.round(g * 255).toString(16)+Math.round(b * 255).toString(16);
  };

  return function(){
    h += golden_ratio_conjugate;
    h %= 1;
    return hslToRgb(h, 0.5, 0.60);
  };
})();


// From https://bl.ocks.org/mbostock/8027637
function closestPoint(pathNode, point) {
  var pathLength = pathNode.getTotalLength(),
      precision = 8,
      best,
      bestLength,
      bestDistance = Infinity;

  // linear scan for coarse approximation
  for (var scan, scanLength = 0, scanDistance; scanLength <= pathLength; scanLength += precision) {
    if ((scanDistance = distance2(scan = pathNode.getPointAtLength(scanLength))) < bestDistance) {
      best = scan, bestLength = scanLength, bestDistance = scanDistance;
    }
  }

  // binary search for precise estimate
  precision /= 2;
  while (precision > 0.5) {
    var before,
        after,
        beforeLength,
        afterLength,
        beforeDistance,
        afterDistance;
    if ((beforeLength = bestLength - precision) >= 0 && (beforeDistance = distance2(before = pathNode.getPointAtLength(beforeLength))) < bestDistance) {
      best = before, bestLength = beforeLength, bestDistance = beforeDistance;
    } else if ((afterLength = bestLength + precision) <= pathLength && (afterDistance = distance2(after = pathNode.getPointAtLength(afterLength))) < bestDistance) {
      best = after, bestLength = afterLength, bestDistance = afterDistance;
    } else {
      precision /= 2;
    }
  }

  best = [best.x, best.y];
  best.distance = Math.sqrt(bestDistance);
  return best;

  function distance2(p) {
    var dx = p.x - point[0],
        dy = p.y - point[1];
    return dx * dx + dy * dy;
  }
}
