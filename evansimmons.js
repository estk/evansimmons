Router.configure({
  layoutTemplate: 'layout'
});

Router.map(function () {
  this.route('home', {
    path: '/',
    template: 'home',
    after: renderHome,
    waitOn: function() {
      return Meteor.subscribe("knowledge");
    },
    unload: function() {
      d3.select("svg.home").remove();
    }
  });
  this.route('work', {
    path: '/work',
    template: "work",
    after: renderWork,
    waitOn: function() {
      return Meteor.subscribe("work");
    },
    unload: function() {
      unloadWork();
    }
  });
});

// Library

function renderHome() {
  "use strict";

  var cscale = d3.scale.linear()
      .range(['rgb(207, 150, 190)', 'rgb(89, 182, 187)', 'rgb(145, 179, 98)'])
      .interpolate(d3.interpolateLab)

  var margin = {top: 20, right: 10, bottom: 20, left: 10};
  var width = 1100 - margin.left - margin.right,
      height = 800 - margin.top - margin.bottom,
      origin = {x: width/2, y: 2*height/3};

  var svg = d3.select("body").selectAll("svg.home")
    .data([1]).enter()
    .append("svg")
      .attr("class", "home")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("xmlns", "http://www.w3.org/2000/svg")
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var hmarg = 300,
      hsep = (width-hmarg)/3,
      vsep = height/4;

  var hpos = [hmarg, hsep+hmarg, hsep*2+hmarg]
  var nodes = [],
      foci = { 
              languages: {x: hpos[0], y: vsep},
              skills: {x: hpos[1], y: vsep},
              tools: {x:hpos[2], y: vsep}
             };

  d3.select("body")
      .on("mousedown", mousedown);

  makeLabels();

  var force = d3.layout.force()
      .nodes(nodes)
      .links([])
      .gravity(0)
      .size([width, height])
      .charge(function(d,i){ return -d.knowledge*30; })
      .theta(.9)
      .on("tick", tick);

  var node = svg.selectAll("g.node");
  var addInterval;

  d3.json("knowledge.json", function (error, json) {
    var klist = [];
    // Make list of "pre"-nodes
    for (var c in json) {
      json[c].forEach(function(o) {
        o.category = c;
        klist.push(o);
      });
    }
    klist = shuffle(klist);

    addInterval = setInterval(function () {
        if (klist.length === 0) {
          clearInterval(addInterval);
          return;
        }
        var curNode = klist.pop()
        curNode.x = origin.x;
        curNode.y = origin.y;
        

        nodes.push(curNode);
        force.start();
        enterUpdater();

    }, 200);
  });

  function enterUpdater() {
    node = node.data(nodes, function(d) { return d.name; });
    var g = node.enter().insert("g", ".fo")
        .attr("class", "node")
        .attr("transform", function (d,i) { return "translate("+ d.x + ","+ d.y +")";})
        .call(force.drag)
      .append("a")
        .attr("xlink:href", function(d){ return d.link; });

    g.append("circle")
        .attr("r", function(d,i){return 1;})
        .attr("class", function(d) { return d.category; })
        .attr('fill', color)
    g.select("circle").transition()
        .duration(200)
        .ease("cubic")
        .attr("r", function(d,i){return d.knowledge*5;});

    g.append("text")
        .attr("fill", "dimgrey")
        .attr("font-size", "1e-6px")
        .text(function(d){ return d.name; });

    g.select("text").transition()
        .duration(200)
        .ease("cubic")
        .attr("font-size", "13px");

    // Helpers
    function radius(d) {
      return d.knowledge*5;
    }
    function color(d) {
      if (d.category === 'languages')
        return cscale(0)
      if (d.category === 'skills')
        return cscale(.75)
      if (d.category === 'tools')
        return cscale(1)
    }
  }

  function tick(e) {
    var k = .1 * e.alpha;
    // Push nodes toward their designated focus.
    nodes.forEach(function(o, i) {
      o.y += (foci[o.category].y - o.y) * k;
      o.x += (foci[o.category].x - o.x) * k;
    });

    node
      .attr("transform", function (d,i) { return "translate("+ d.x + ","+ d.y +")";})
  }

  function removeNodes() {
    var wait = 20;
    var duration = 50;

    var exit = svg.selectAll("g.node")
      .data([])
      .exit()
      .transition()
        .delay(function(d,i) {return i*wait;})
        .duration(duration);

    exit.selectAll("circle")
        .attr("r", function(d,i){return 1e-6;})
    exit.selectAll("text")
        .attr("font-size", "1e-6px")
    exit.remove()

    return nodes.length * wait + duration;
  }

  function mousedown() {
    nodes.forEach(function(o, i) {
      o.x += (Math.random() - .5) * 40;
      o.y += (Math.random() - .5) * 40;
    });
    force.resume();
  }

  function shuffle(array) {
    var m = array.length, t, i;

    // While there remain elements to shuffle…
    while (m) {

      // Pick a remaining element…
      i = Math.floor(Math.random() * m--);

      // And swap it with the current element.
      t = array[m];
      array[m] = array[i];
      array[i] = t;
    }

    return array;
  }

  function removeLabels() {
    var wait = 25;
    var duration = 100;
    var headings = svg.select(".headings");

      headings.selectAll("text")
        .transition()
          .duration(duration)
          .ease("linear")
          .delay(function(d,i) {return i*wait})
          .attr("font-size", "1e-6px")
          .remove();
    svg.select(".fo")
      .transition()
        .duration(250)
        .ease("cubic")
        .attr("transform", "translate(" + (origin.x-250) +","+ height +")")
        .remove()

    return Math.max(wait*3 + duration, 250);
  }

  function makeLabels () {
    var headings = svg.append("g")
        .attr("class", "headings")

    headings.append("text")
      .attr("font-size", "48px")
      .attr("x", hpos[0]-50)
      .attr("y", 0)
      .text("Languages");

    headings.append("text")
      .attr("font-size", "48px")
      .attr("x", hpos[1])
      .attr("y", 0)
      .text("Skills");

    headings.append("text")
      .attr("font-size", "48px")
      .attr("x", hpos[2]+50)
      .attr("y", 0)
      .text("Tools");

    var fo = svg.append("foreignObject")
      .attr("class","fo")
      .attr("width", "500px")
      .attr("height", "300px")
      .attr("transform", "translate(" + (origin.x-250) +","+ (origin.y-100) +")")

    d3.text("info.html", function(error, html) {
      fo.append("xhtml:body")
        .attr("id", "info")
        .html(Template.info());

        d3.select("#worklink")
        .on("mousedown", function() { 
          var ltime = removeLabels(),
              ntime = removeNodes(); 
          var time = Math.max(ltime,ntime);

          clearTimeout(addInterval);
          setTimeout(function() {
            d3.select("svg.home").remove();
            Router.go("work");
          }, time);
        });
    })
  }
}


function renderWork() {
  "use strict";
  var margin = {top: 20, right: 10, bottom: 20, left: 10};
  var width = 1100 - margin.left - margin.right,
      height = 800 - margin.top - margin.bottom,
      origin = {x: width/2, y: 2*height/3};

  var svg = d3.select("body").selectAll("svg.work")
    .data([1]).enter()
    .append("svg")
      .attr("class", "work")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("xmlns", "http://www.w3.org/2000/svg")
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var parseDate = d3.time.format("%Y-%m-%d").parse;

  var x = d3.time.scale()
      .domain([parseDate("2013-1-1"), parseDate("2014-6-1")])
      .range([200, width-200]);
  var y = d3.time.scale()
      .domain([parseDate("2013-1-1"), parseDate("2014-6-1")])
      .range([height-300, 300]);

  var cscale = d3.time.scale()
    .domain([parseDate("2013-1-1"), parseDate("2014-6-1")])
    .range(['rgb(207, 150, 190)', 'rgb(89, 182, 187)', 'rgb(145, 179, 98)'])
    .interpolate(d3.interpolateLab)

  makeLabel();

  var addInterval, 
      nodes = [];


  var force = d3.layout.force()
    .nodes(nodes)
    .gravity(0)
    .charge(function(d,i){ return -d.pages*200; })
    .size([width, height])
    .on("tick", tick);

  var node = svg.selectAll("g.node");

  d3.json("work.json", function (error, json) {
    var work = json.work;

    var addInterval = setInterval(function () {
        if (work.length === 0) {
          clearInterval(addInterval);
          return;
        }
        var curNode = work.pop()
        curNode.x = width/2;
        curNode.y = height;
        curNode.cy = y(parseDate(curNode.date));
        curNode.cx = x(parseDate(curNode.date));
        curNode.r = Math.sqrt(curNode.pages)*20

        nodes.push(curNode);
        force.start();
        enterUpdater();
    }, 200);
  });

  function enterUpdater() {
    node = node.data(nodes, function(d){ return d.name; });
    var g = node.enter().append("g")
        .attr("class","node")
        .attr("transform", function(d) { return "transition("+ d.x +","+ d.y +")";})
        .call(force.drag)
      .append("a")
        .attr("xlink:href", function(d){ return d.link; });

    g.append("path")
        .attr("stroke", "grey")
        .attr("stroke-width", "1px")
        .attr("d", function (d) { return "M0,0 L0,0"; })
    g.select("path").transition()
        .delay(200)
        .duration(600)
        .ease("linear")
        .attr("d", function (d) { return "M0,0 L0,"+ -(d.r+30); })

    g.append("circle")
        .attr("fill", function(d){ return cscale(parseDate(d.date)); })
        .attr("r", 1e-6);
    g.select("circle").transition()
        .duration(200)
        .ease("cubic")
        .attr("r", function(d,i){ return d.r; });

    g.append("text")
        .attr("font-size", "1e-6px")
        .attr("y", 0)
        .attr("fill", "grey")
        .text(function(d){ return d.name; });
    g.select("text").transition()
        .duration(700)
        .ease("cubic")
        .attr("font-size", "13px")
        .attr("y", function(d){ return -(d.r+40); })
  }
  function tick (e) {
    var k = e.alpha * .1;
    nodes.forEach(function(node) {
      node.y += (node.cy - node.y) * k;
      node.x += (node.cx - node.x) * k;
    });

    node
      .attr("transform", function (d,i) { return "translate("+ d.x + ","+ d.y +")";})
  };

  function makeLabel() {
    var headings = svg.append("g")
        .attr("class", "headings");

    headings.append("text")
        .attr("class", "label")
        .attr("font-size", "58px")
        .attr("y",0)
        .attr("x", width/2)
        .text("2013-14");

    headings.append("a")
      .append("text")
        .attr("id","back")
        .attr("x", 150)
        .attr("y", 0)
        .attr("class", "label")
        .attr("font-size", "58px")
        .attr("font-weight", "100")
        .attr("stroke", "rgb(89, 182, 187)")
        .text("BACK")

      svg.select("#back")
        .on("mousedown", unloadWork);


      window.unloadWork = unloadWork;
  }

function removeLabels() {
    var wait = 50;
    var duration = 100;
    var headings = svg.select(".headings");

    headings.selectAll("text")
      .transition()
        .duration(duration)
        .ease("linear")
        .delay(function(d,i) {return i*wait})
        .attr("font-size", "1e-6px")
        .remove();

  return wait*nodes.length + duration;
}

function unloadWork() {
  var ltime = removeLabels(),
      ntime = removeNodes(); 
  var time = Math.max(ltime,ntime);

  clearTimeout(addInterval);
  setTimeout(function() {
    d3.select("svg.work").remove()
    Router.go("/")
  }, time);
}

function removeNodes() {
    var wait = 25;
    var duration = 100;

    var exit = svg.selectAll("g.node")
      .data([])
      .exit()
      .transition()
        .delay(function(d,i) {return i*wait;})
        .duration(duration);

    exit.selectAll("circle")
        .attr("r", function(d,i){return 1e-6;})
    exit.selectAll("text")
        .attr("font-size", "1e-6px")
        .attr("y", 0)
    exit.selectAll("path")
        .attr("d", "M0,0 L0,0");
    exit.remove()

  return wait*nodes.length + duration;
}

}

