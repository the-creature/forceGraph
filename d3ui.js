var d3ui = (function() {
    var width, height, root, link, node, force, svg, id;

    var init = function(sel, url) {
        id = sel;
        width = parseInt(d3.select(id).style('width'), 10);
        height = parseInt(d3.select(id).style('height'), 10)-20;
        force = d3.layout.force()
            .size([width, height])
            .on("tick", tick);

        svg = d3.select(id).append("svg")
            .attr("width", width)
            .attr("height", height);
        create(url);
        d3.select(window).on('resize', resize);
    }

    var create = function(data) {
        if ("string" === typeof data) {
            d3.json(data, function (error, json) {
                if (error) throw error;
                root = json;
                update();
            });
        } else if('object' === typeof data) {
            root = data;
            update();
        }
    }

    var update = function() {
        var nodes = flatten(root);
        var links = d3.layout.tree().links(nodes);
        var MinMaxNode = d3.extent(nodes, function(d) { return d.size; });
        var bubbleScale = d3.scale.linear().domain(MinMaxNode).range([20, 120]);
        var linkScale = d3.scale.linear().domain(MinMaxNode).range([130,420]);
        // Restart the force layout.
        force
            .nodes(nodes)
            .links(links)
            .friction(0.5)
            .linkDistance(function(d){
                return linkScale(d.target.size);
            })
            .gravity(0.1)
            .charge(-1000)
            .theta(0.1)
            .alpha(0.1)
            .start();
        // Update the links…
        link = svg.selectAll(".link").data(links, function(d) { return d.target.id; });
        // Exit any old links.
        link.exit().remove();
        // Enter any new links.
        link.enter().insert("line", ".node")
            .attr("class", function(d){
                return d.source.name == "flare" ? "" : "link";
            })
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });
        // Update the nodes…
        node = svg.selectAll(".node").data(nodes, function(d) { return d.id; });
        node.exit().remove();
        node.enter().append("g")
            .attr("class","node")
            .call(force.drag);
        node.append("circle")
            .attr("class", function(d){
                return d.type === 'root' ? "node" : "leaf";
                //return d.children || d._children ? "node" : "leaf";
            })
            .attr("r", function(d) {
                // if(d.type == "root") return 90;
                return bubbleScale(d.size) || 0;
            })
            .style("fill", color)
            .on("click", click);
        node.append("text")
            .attr("dx", -16)
            .attr("dy", ".35em")
            .text(function(d) {
                return d.name !== 'flare' ? d.name : '';
            });
    }

    var tick = function() {
        var xy = function(d, item, l) {
            var nodes = flatten(root);
            var MinMaxNode = d3.extent(nodes, function(d) { return d.size; });
            var linkScale = d3.scale.linear().domain(MinMaxNode).range([20, 120]);
            return d-linkScale(item.size) < 0
                ? 0+linkScale(item.size)
                : d+linkScale(item.size) > l
                ? l-linkScale(item.size)
                : d;
        };
        link
            .attr("x1", function(d) { return xy(d.source.x, d.source, width ); })
            .attr("y1", function(d) { return xy(d.source.y, d.source, height ); })
            .attr("x2", function(d) { return xy(d.target.x, d.target, width ); })
            .attr("y2", function(d) { return xy(d.target.y, d.target, height ); });
        node.attr("transform", function(d) {
            return "translate(" +
                xy(d.x, d, width ) +
                "," +
                xy(d.y, d, height) +
                ")";
        });
    }

    var color = function(d) {
        return d._children
            ? "#BECDD5"
            : d.children
              ? "#BECDD5"
              : d.type === 'root' ? "#EF9A9A" : "white";
    }

    var click = function(d) {
        if (!d3.event.defaultPrevented) {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }
            update();
        }
    }

    var flatten = function(root) {
        var nodes = [], i = 0;
        function recurse(node) {
            if (node.children) node.children.forEach(recurse);
            if (!node.id) node.id = ++i;
            nodes.push(node);
        }
        recurse(root);
        return nodes;
    }

    var resize = function() {
        width = parseInt(d3.select(id).style('width'), 10);
        height = parseInt(d3.select(id).style('height'), 10)-20;
        svg
            .attr("width", width)
            .attr("height", height);
        force.size([width, height]);
        update();
    }

    return {
      init: init
    }
}());