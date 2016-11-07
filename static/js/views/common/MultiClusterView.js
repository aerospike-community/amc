/******************************************************************************
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
******************************************************************************/

define(["jquery", "underscore", "backbone", "d3", "timechart", "timeseriesChart", "config/view-config", "config/app-config", "helper/notification"], function($, _, Backbone, D3, TimeChart, TimeseriesChart, ViewConfig, AppConfig, Notification){
    var MultiClusterView = Backbone.View.extend({

        initialize: function(options){
            var that = this;
            this.el = options.el;
            $("#multicluster_xdr_port").val(window.AMCGLOBALS.persistent.xdrPort);
            this.initialized = false;
            this.emptyContainer();
            this.type = {
                namespaces : "namespaces",
                cluster : "cluster",
                node : "node",
                xdrLink : "xdrLink"
            };
            this.params = {
                events: {
                    sliceOver: function(d, i, cluster){
                        var cord = $(this).offset();
                        var top = cord.top;
                        var left = cord.left;
                        that.renderTooltip(d, typeof(event) != "undefined" ? event.x : left, typeof(event) != "undefined" ? event.y : top, that.type.namespaces,cluster);
                    },
                    sliceOut : function(d, i, cluster){
                        $(".multicluster-tooltip").css('display', 'none');
                    },
                    centerOver: function(d, i){
                       that.renderTooltip(d, typeof(event) != "undefined" ? event.x : d.x, typeof(event) != "undefined" ? event.y : d.y, that.type.cluster);
                    },
                    centerOut: function(d, i){
                        $(".multicluster-tooltip").css('display', 'none');
                    },
                    nodeOver: function(d, i){
                        that.renderTooltip(d, typeof(event) != "undefined" ? event.x : d.x+12, typeof(event) != "undefined" ? event.y : d.y,that.type.node);
                    },
                    nodeOut: function(d,i){
                        $(".multicluster-tooltip").css('display', 'none');
                    },
                    linkOver: function(d, i){
                        var cord = $(this).offset();
                        var top = cord.top;
                        var left = cord.left;
                        var shipping_namespaces = typeof(d.source.xdr_info[d.target["cluster_id"]]) !== "undefined" ? d.source.xdr_info[d.target["cluster_id"]].shipping_namespaces.join(", ") : "";
                        that.renderTooltip(d, typeof(event) != "undefined" ? event.x : left, typeof(event) != "undefined" ? event.y : top, that.type.xdrLink, shipping_namespaces);
                    },
                    linkOut: function(){
                        $(".multicluster-tooltip").css('display', 'none');
                    },
                    clusterClick: function(d, i){},
                    nodeClick: function(d, i){},
                    inFocus: function(d, i){},
                    //Initiate AMC Dashboard
                    initiate: function(d, i){
                        if(d.discovery != "not_available"){
                            //Hide the tool tip on click
                            $(".multicluster-tooltip").css('display', 'none');
                            var xdr_port = $("#multicluster_xdr_port").val();
                            if(window.$("#rightPanelButton").hasClass("active")){
                                window.$("#rightPanelButton").trigger("click");
                            }else{
                                window.$("#changeClusterButton.active").trigger("click");
                            }

                            window.$.event.trigger("view:multiclusterDestroy","Stop multicluster polling");
                            if($("#wrap").hasClass("fullScreen")){
                                $("#wrap").removeClass("fullScreen");
                            }
                            var previousUrl = false;
                            if(window.location.hash.indexOf("/") == -1){
                                previousUrl = true;
                            }

                            var url = window.location.protocol + "//" + window.location.host + "/#dashboard/" + d.seednode;
                            window.location = url;

                            if($("#xdr_port").val() != "undefined")
                                $("#xdr_port").val(xdr_port);

                            /*if(previousUrl || d.discovery == "secured")
                                window.location.reload();*/
                        }
                    }
                },
                allowDragging: false,
                clusterDiameter: 150,
                nodeDiameter: 10,
                clusterTextPadding: 15,
                containerPadding: 15,
                renderStatic: true,
                enableAutoFocus: false,
                //Function returning a color based on input
                sliceColorScale: d3.scale.category20c().range(["#3182bd", "#6baed6", "#9ecae1", "#42c0fb", "#3299cc", "#539dc2", "#67c8ff", "#5cacee", "#4e78a0", "#4f94cd"])
            };

            this.galaxyModel = {
                galaxySystem: {
                    nodes: [],
                    links: []
                }
            };

            this.initContainer(function(){
                that.initialized = true;
                if (typeof that.update === "undefined") {
                    that.update = that.setupView(that.el, that.params);
                }
            });
        },

        renderTooltip: function(d,left,top,type,cluster){
            d3.select('.multicluster-tooltip').style("left", left + "px");
            d3.select('.multicluster-tooltip').style("top", top + "px");

            $(".multicluster-tooltip").empty();
            var template = _.template($('#multiclusterTooltip').text());
            var compiled = template({data : d, type : type, cluster: cluster});
            $(".multicluster-tooltip").append(compiled);
            $(".multicluster-tooltip").css('display', 'block');
        },

        initContainer: function(callback){
            if(!$("#wrap").hasClass("fullScreen")){
                $("#wrap").addClass("fullScreen");
            }
            //$("#rightPanelCloseButton").css('display', 'none');
            setTimeout(callback, 500);
        },

        emptyContainer: function(){
            d3.selectAll(".multi-cluster").remove();
        },

        render: function(data, tries){
            var that = this;
            if(!this.initialized){
                tries = tries || 0;
                tries++;
                if(tries <= 15){
                    setTimeout(function(){
                        that.render(data, tries);
                    }, 250);
                }
            } else {
                $(AppConfig.header.subHeader).slideUp(0);
                setTimeout(function(){
                    Notification.cleanUp();
                }, 3000);

                if(data)
                    that.start(data, that.update);
            }
        },
        reRender : function(){
            if(this.options.collection.lastResponse)
                this.render(this.options.collection.lastResponse);
        },
        start: function(data,callback) {
            var parsed = this.parse(data);
            callback && callback(parsed);
        },

        createDCName: function(source, destination) {
            var xdr_info = destination['xdr_info'];
            if (xdr_info[source["cluster_id"]] != null &&
                xdr_info[source["cluster_id"]]['dc_name'] != null &&
                xdr_info[source["cluster_id"]]['dc_name'] !== "") {
                destination["dc_name"] = (destination["dc_name"] || []);
                destination["dc_name"].push(xdr_info[source["cluster_id"]]['dc_name']);
            }
        },

        /* Parser */
        parse: function (response) {
            var that = this;
            var focusSet = false;

            var allClusters = response.data;
            var galaxySystem = that.galaxyModel.galaxySystem;
            var availableClusters = _.keys(allClusters);

            var galaxyClusters = [];

            if(window.AMCGLOBALS.persistent.clusterID && response.data[window.AMCGLOBALS.persistent.clusterID]){
                response.data[window.AMCGLOBALS.persistent.clusterID].focused = true;
            }

            _.each(galaxySystem.nodes, function(galaxyEntity) {
                if (galaxyEntity['entity_type'] === 'cluster') {
                    galaxyClusters.push(galaxyEntity['cluster_id']);
                }
            });

            var removedClustersList = _.difference(galaxyClusters, availableClusters);
            var newClustersList = _.difference(availableClusters, galaxyClusters);

            //checking for xdr update
            var xdr_update = [];
            _.each(galaxySystem.nodes, function(galaxyEntity) {
                if (galaxyEntity['entity_type'] === 'cluster' && removedClustersList.indexOf(galaxyEntity['cluster_id']) === -1){
                    var clusterId = galaxyEntity['cluster_id'];

                    var oldXdrKeys = _.keys(galaxyEntity['xdr_info']);
                    var newXdrKeys = _.keys(allClusters[clusterId]['xdr_info']);

                    var removedXdrList = _.difference(oldXdrKeys, newXdrKeys);
                    var newXdrList = _.difference(newXdrKeys, oldXdrKeys);

                    var changeXdrList = _.union(removedXdrList,newXdrList);

                    if(changeXdrList.length > 0){
                        //galaxyEntity['xdr_info'] = allClusters[clusterId]['xdr_info'];
                        allClusters[clusterId].focused = !!galaxyEntity.focused;
                        xdr_update.push(clusterId);
                    }
                }
            });

            removedClustersList = _.union(removedClustersList, xdr_update);
            newClustersList = _.union(newClustersList, xdr_update);

            //Find existing clusters nodes and links in galaxy
            var nodes = _.filter(galaxySystem.nodes, function(cluster, index) {
                return !_.contains(removedClustersList, cluster['cluster_id']);
            });

            var links = _.filter(galaxySystem.links, function(link, index) {
                return !(_.contains(removedClustersList, link.source['cluster_id']) || _.contains(removedClustersList, link.target['cluster_id']));
            });

            //Add new cluster, cluster's nodes, cluster-node links, cluster-cluster links
            _.each(newClustersList, function(cluster_id) {
                var cluster = allClusters[cluster_id];
                cluster['cluster_id'] = cluster_id;
                cluster['entity_type'] = 'cluster';

                nodes.push(cluster);
                for (var node_id in cluster.nodes) {
                    var node = cluster.nodes[node_id];
                    node['node_id'] = node_id;
                    node['entity_type'] = 'node';
                    node['cluster_id'] = cluster_id;

                    nodes.push(node);
                    links.push({
                        source: cluster,
                        target: node,
                        direction: 'omni',
                        type: 'cluster-node'
                    });
                }

                //add new xdr link
                _.each(nodes, function(node) {
                    if (node['entity_type'] === 'cluster' &&
                        (node['xdr_info'][cluster_id] != null || cluster['xdr_info'][node['cluster_id']] != null)) {
                        var xdr_info = cluster['xdr_info'],
                            biDirectional = (node['xdr_info'][cluster_id] != null && cluster['xdr_info'][node['cluster_id']] != null);

                        // if (biDirectional) {
                        //     existingLink = _.find(links, function(link) {
                        //         return (link.source['cluster_id'] === cluster_id &&
                        //                 link.source['entity_type'] === 'cluster' &&
                        //                 link.target['entity_type'] === 'cluster');
                        //     });
                        // }

                        // if (xdr_info[node["cluster_id"]] != null &&
                        //     xdr_info[node["cluster_id"]]['dc_name'] != null &&
                        //     xdr_info[node["cluster_id"]]['dc_name'] !== "") {
                        //     cluster["dc_name"] = (cluster["dc_name"] || []);
                        //     cluster["dc_name"].push(xdr_info[node["cluster_id"]]['dc_name']);
                        // }

                        if (node['xdr_info'][cluster_id] != null &&
                            !_.find(links, function(link){return link.source === node && link.target === cluster;})){
                            that.createDCName(node, cluster);
                            links.push({
                                source: node,
                                target: cluster,
                                type: 'cluster-cluster',
                                direction: biDirectional ? 'bi' : "omni"
                            });
                        }

                        if(cluster['xdr_info'][node['cluster_id']] != null &&
                            !_.find(links, function(link){return link.source === cluster && link.target === node;})){
                            that.createDCName(cluster, node);
                            links.push({
                                source: cluster,
                                target: node,
                                type: 'cluster-cluster',
                                direction: biDirectional ? 'bi' : "omni"
                            });
                        }
                    }
                });
            });

            //Deep extend existing cluster properties with new available
            _.each(nodes, function(cluster) {
                if (cluster['entity_type'] === 'cluster') {
                    $.extend(true, cluster, allClusters[cluster['cluster_id']]);
                    //updating namespaces and xdr_info to cluster
                    cluster['namespaces'] = $.extend(true, [], allClusters[cluster['cluster_id']]['namespaces']);
                    cluster['xdr_info'] = $.extend(true, [], allClusters[cluster['cluster_id']]['xdr_info']);
                }
            });

            //Push all information back to galaxy system
            galaxySystem.nodes.splice(0, galaxySystem.nodes.length);
            Array.prototype.push.apply(galaxySystem.nodes, nodes);

            galaxySystem.links.splice(0, galaxySystem.links.length);
            Array.prototype.push.apply(galaxySystem.links, links);

            return galaxySystem;
        },
        /* Creates a pie for namespaces */
        enterPie: function (data, params) {
            var clusterData = data;
            var radius = Math.min(params.width, params.height) / 2;

            var pieGroup = this;

            var pie = d3.layout.pie()
                .sort(null)
                .value(function(d) {
                    return d.value;
                });

            var arc = d3.svg.arc()
                .outerRadius(radius)
                .innerRadius(0.75 * radius);

            var color = params.sliceColorScale || d3.scale.category20c().range(["#3182bd", "#6baed6", "#9ecae1", "#42c0fb", "#3299cc", "#539dc2", "#67c8ff", "#5cacee", "#4e78a0", "#4f94cd"]);

            var key = function(d) {
                return d.data.name;
            };

            var textArcOuterRadius = Math.max(0.75 * radius - (params.textPadding || 20), 0);
            var textArcAnchorPoint = Math.PI * textArcOuterRadius;
            var pieIdentity;

            if (data.seednode) {
                pieIdentity = "Seed: " + data.seednode;
            } else if(data.clustername){
                pieIdentity = "Name: " + data.clustername;
            } else if (data.dc_name.length != 0) {
                pieIdentity = "DC Names: " + data.dc_name.join(", ");
            }

            //Text Arcs generator
            var textTopArc = d3.svg.arc()
                .outerRadius(textArcOuterRadius)
                .innerRadius(0)
                .startAngle(-Math.PI)
                .endAngle(Math.PI);

            //Central Background
            pieGroup.append("circle")
                .attr("r", (0.75 * radius))
                .attr("fill", "white");

            pieGroup.append("svg:path")
                .attr("d", textTopArc)
                .attr("id", "textPath-" + data[data['entity_type'] + "_id"])
                .attr("fill", "transparent");

            pieGroup.append("svg:text")
                .attr("text-anchor", "middle")
                .attr("x", textArcAnchorPoint)
                .attr("class", "cluster text centre-text")
                    .append("svg:textPath")
                    .attr("xlink:href", "#textPath-" + data[data['entity_type'] + "_id"])
                    .text(pieIdentity);

            pieGroup.append("circle")
                .attr("r", (0.75 * radius))
                .attr("fill", "transparent")
                .on("mouseover", params.events.centerOver)
                .on("mouseout", params.events.centerOut);

            function updatePie(data) {

                /* ------- PIE SLICES -------*/
                var slice = pieGroup.selectAll("path.slice")
                    .data(pie(data), key);

                slice.enter()
                    .insert("path")
                    .style("fill", function(d) {
                        return color(d.data.name);
                    })
                    .attr("class", "slice");

                slice
                    .transition().duration(1000)
                    .attrTween("d", function(d) {
                        this._current = this._current || d;
                        var interpolate = d3.interpolate(this._current, d);
                        this._current = interpolate(0);
                        return function(t) {
                            return arc(interpolate(t));
                        };
                    });

                slice
                    .on("mouseover", function(d, i){
                        params.events.sliceOver && params.events.sliceOver.call(this, d, i, clusterData);
                    });
                slice
                    .on("mouseout", function(d, i){
                        params.events.sliceOut && params.events.sliceOut.call(this, d, i, clusterData);
                    });

                slice.exit()
                    .remove();
            }

            return updatePie;
        },
        /* Collision detection and mitigation */
        collide : function (node) {
            var r,
                nx1 = node.x - r,
                nx2 = node.x + r,
                ny1 = node.y - r,
                ny2 = node.y + r;
            return function(quad, x1, y1, x2, y2) {
                if (quad.point && (quad.point !== node)) {
                    var x = node.x - quad.point.x,
                        y = node.y - quad.point.y,
                        l = Math.max(Math.sqrt(x * x + y * y), 1),
                        r = node.size + quad.point.size + (10/*Distance between nodes*/);
                    if (l < r) {
                        l = (l - r)/l* .5;
                        x *= l;
                        y *= l;
                        if(!node.focused) {
                            node.x -= x;
                            node.y -= y;
                        }
                        if(!quad.point.focused) {
                            quad.point.x += x;
                            quad.point.y += y;
                        }
                    }
                }
                return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
            };
        },

        /* Parameter container DOM; returns update function */
        setupView: function (container, params) {
            params.clusterDiameter = params.clusterDiameter || 150;
            params.nodeDiameter = params.nodeDiameter || 10;

            var that = this;
            var animationTimer = null;
            var forceRunning = false;
            var forceAnimate = !params.renderStatic;
            var clusterLinkSize = 300;

            d3.selectAll(".multi-cluster").remove();
            var $container = $(container);

            var _nodes = [],
                _links = [];

            var width = $container.width(),
                height = ((parseInt($(window).height()))-(20 + $(".header-container .header").height()));

            var padding = params.containerPadding || 15;

            var focusedCord, boundingBox;

            var allowDragging = (!params.renderStatic && params.allowDragging) || false;

            var lineGen = d3.svg.line()
                .x(function(d){return x(d.x);})
                .y(function(d){return y(d.y);});

            var svg = d3.select(container)
                .append("svg:svg")
                .attr("class", "multi-cluster");

            /*Bind event on window size change*/
            $(window).resize(function() {
                that.reRender();
            });

            var $node = svg.selectAll(".nodes"),
                $link = svg.selectAll(".link");

            //code for legends
            svg.selectAll("legend_title")
              .data(["Legends"])
              .enter()
              .append("text")
                .attr("x", 10)
                .attr("y", function (d, i) { return 90 + i * 14; })
                .style("font-size", "15px")
                .text(function (d) { return d; });

            var legendRectSize = 18;
            var legendSpacing = 4;
            var legendData = [{"color":"#5DD25D","text":"Node ON"},{"color":"#E02A2A","text":"Node OFF"}];
            var legend = svg.selectAll('.legend')
                .data(legendData)
                .enter()
                .append('g')
                .attr('class', 'legend')
                .attr('transform', function(d, i) {
                    horz = 10;
                    vert = 100 + i * 30;
                    return 'translate(' + horz + ',' + vert + ')';
                });

            legend.append('rect')
                .attr('width', legendRectSize)
                .attr('height', legendRectSize)
                .style('fill', function(d){return d.color;})
                .style('stroke', function(d){return d.color;});

            legend.append('text')
                .attr('x', legendRectSize + legendSpacing)
                .attr('y', legendRectSize - legendSpacing)
                .text(function(d) { return d.text; });

            var force = d3.layout.force()
                .nodes(_nodes)
                .links(_links)
                .charge(-400)
                .gravity(0.02)
                .friction(0.8)
                .alpha(0.06)
                .linkDistance(function(d) {
                    var scaledNodeDistance = (d.source.focused ? 90 : 65);
                    return d.type === "cluster-cluster" ? clusterLinkSize : scaledNodeDistance;
                })
                .on("tick", function(e) {
                    var q = d3.geom.quadtree(_nodes),
                        i = 0,
                        n = _nodes.length,
                        ci = 0;

                    _nodes.forEach(function(d) {
                        //Push Focused node to center
                        if (d.focused) {
                            var rangeX = [focusedCord[0] - 5, focusedCord[0] + 5];
                            var rangeY = [focusedCord[1] - 5, focusedCord[1] + 5];

                            if (d.x < rangeX[0] || d.x > rangeX[1]) {
                                d.x += (focusedCord[0] - d.x) * e.alpha;
                                d.px = d.x;
                            }

                            if (d.y < rangeY[0] || d.y > rangeY[1]) {
                                d.y += (focusedCord[1] - d.y) * e.alpha;
                                d.py = d.y;
                            }
                        }
                        d.x = d.x;

                        //collision detection
                        while (++i < n) q.visit(that.collide(_nodes[i]));

                        //Bounding box forces
                        if ((d.x - d.size) < boundingBox.topX) {
                            d.x += (boundingBox.topX + d.size - d.x) * e.alpha;
                        }

                        if ((d.x + d.size) > boundingBox.bottomX) {
                            d.x -= (d.x + d.size - boundingBox.bottomX) * e.alpha;
                        }

                        if ((d.y - d.size) < boundingBox.topY) {
                            d.y += (boundingBox.topY + d.size - d.y) * e.alpha;
                        }

                        if ((d.y + d.size) > boundingBox.bottomY) {
                            d.y -= (d.y + d.size - boundingBox.bottomY) * e.alpha;
                        }

                    });

                    if(forceAnimate) {
                        updateDomPositionalData();
                    }
                });

                force.on("end", function() {
                    forceRunning = false;
                    if(!forceAnimate) {
                        updateDomPositionalData();
                    }
                    forceAnimate = !params.renderStatic;
                });

                force.on("start", function() {
                    forceRunning = true;
                    d3.selectAll(".xdr-directions")
                        .remove();

                    d3.selectAll(".xdrLinkNamespaces")
                        .remove();
                });

            function updateGraph(system) {
                var width = $container.width(),
                    height = ((parseInt($(window).height()))-(20 + $(".header-container .header").height())),
                    updateNeeded = false,
                    update = false,
                    focusSet = false,
                    nodes = system.nodes,
                    links = system.links;

                if ($(svg[0][0]).width() !== width || $(svg[0][0]).height() !== height){
                    updateNeeded = true;
                }

                if (updateNeeded || isUpdateNeeded(nodes,links)) {
                    svg.attr("width", width).attr("height", height);

                    force.size([width, height]);

                    focusedCord = [width / 2, height / 2];

                    boundingBox = {
                        topX: padding,
                        topY: padding,
                        bottomX: (width - padding),
                        bottomY: (height - padding)
                    };

                    clusterLinkSize = Math.min((height - params.clusterDiameter)/2,
                                                (width - params.clusterDiameter)/2);

                    clusterLinkSize = Math.max(params.clusterDiameter + 50, clusterLinkSize - 40);

                    _nodes.splice(0, _nodes.length);
                    Array.prototype.push.apply(_nodes, nodes);

                    _links.splice(0, _links.length);
                    Array.prototype.push.apply(_links, links);

                    if($(".nodes.focused").length === 0 && params.enableAutoFocus) {
                        var firstCluster = _.find(_nodes, function(node){
                            return node['entity_type'] === "cluster";
                        });

                        firstCluster.focused = true;
                    }

                    for(var cluster in _nodes) {
                        if(_nodes[cluster]['entity_type'] === "cluster"){
                            _nodes[cluster].focused = !!_nodes[cluster].focused;

                            if(focusSet && _nodes[cluster].focused){
                                _nodes[cluster].focused = false;
                            } else if(!focusSet && _nodes[cluster].focused){
                                focusSet = true;
                            }

                            for(var node in _nodes[cluster].nodes){
                                _nodes[cluster].nodes[node].parentFocused = _nodes[cluster].focused;
                            }
                        }
                    }

                    _nodes.forEach(function(d) {
                        var scale = d.focused || d.parentFocused ? 1 : 0.8;

                        if (d['entity_type'] === 'cluster') {
                            var size = params.clusterDiameter || 150;
                            d.size = (size / 2) * scale;
                        } else {
                            var size = params.nodeDiameter || 10;
                            d.size = (size / 2) * scale;
                        }

                        if (d.focused) {
                            d.fixed = true;
                        } else if (d["entity_type"] === "cluster") {
                            d.fixed = false;
                        }
                    });

                    runForceSimulation(!params.renderStatic, function(){
                        updateDomElements(params);
                    });
                } else {
                    updateDomElements(params);
                }
            }

            function isUpdateNeeded(nodes,links){ //Computationaly heavy
                var newNodes = _.map(nodes, function(d){
                    return d[d.entity_type + "_id"];
                });
                var oldNodes = _.map($node.data(), function(d){
                    return d[d.entity_type + "_id"];
                });

                var newLinks = _.map(links, function(d){
                    return d.source[d.source.entity_type + "_id"] + d.target[d.target.entity_type + "_id"];
                });

                var oldLinks =  _.map($link.data(), function(d){
                    return d.source[d.source.entity_type + "_id"] + d.target[d.target.entity_type + "_id"];
                });

                return !!(_.union(_.difference(newNodes, oldNodes), _.difference(oldNodes, newNodes)).length) ||
                       !!(_.union(_.difference(newLinks, oldLinks), _.difference(oldLinks, newLinks)).length);
            }

            function runForceSimulation(enforceAnimations, callback){
                forceAnimate = enforceAnimations;
                if(!enforceAnimations) {
                    var nodesLen = _nodes.length * 6;
                    setTimeout(function(){
                        force.start();
                        for (var i = nodesLen * nodesLen; i > 0; --i) force.tick();
                        force.stop();
                        callback && callback();
                    }, 10);
                } else {
                    force.start();
                    callback && callback();
                }
            }

            function updateDomElements(params) {
                $link = $link
                    .data(force.links(), function(d) {
                        return d.source[d.source['entity_type'] + "_id"] + "-" + d.target[d.target['entity_type'] + "_id"];
                    });

                $link
                    .enter()
                    .insert("path", ".nodes")
                    .attr("class", function(d) {
                        return "link" + (d.type === "cluster-cluster" ? " xdr-link" : " node-link") + " " +
                                (d.source[d.source['entity_type'] + "_id"] + "-" + d.target[d.target['entity_type'] + "_id"]);
                    })
                    .attr("id", function(d) {
                        return d.source[d.source['entity_type'] + "_id"] + "-" + d.target[d.target['entity_type'] + "_id"];
                    });

                $link
                    .exit()
                    .remove();

                $link
                    .attr("marker-end", function(d) {
                        return d.type === "cluster-cluster" ? "url(#"+ (d.direction) +"LinkHead)" : "";
                    })
                    .on("mouseover", params.events.linkOver)
                    .on("mouseout", params.events.linkOut);

                $node = $node
                    .data(force.nodes(), function(d) {
                        return d[d["entity_type"] + "_id"];
                    });

                $node
                    .enter()
                    .append("svg:g")
                    .attr("class", function(d) {
                        return "nodes " + d["entity_type"] + (d.focused ? " focused" : "") + (d.parentFocused ? " parentFocused" : "");
                    })
                    .call(function(nodes) {
                        nodes.each(function(d) {
                            var scale = d.focused || d.parentFocused ? 1 : 0.8;
                            var size = (d.size / scale) * 2;

                            var container = d3.select(this)
                                .append("g")
                                .attr("transform", "scale(" + scale + "," + scale + ")");

                            if (d['entity_type'] === 'cluster') {
                                var textPadding = params.clusterTextPadding || 15;

                                d['update'] = that.enterPie.call(container, d, {
                                    width: size,
                                    height: size,
                                    textPadding: textPadding,
                                    sliceOver: params.sliceOver,
                                    sliceColorScale: params.sliceColorScale,
                                    events: params.events
                                });
                            } else {
                                container
                                    .append("circle")
                                    .attr("r", 10)
                                    .attr("filter", "url(#gblur)");
                            }
                        });
                    })
                    .on("dragstart", function () {
                        d3.event.sourceEvent.stopPropagation();
                    })
                    .on("click", function(d, i){
                        if (d3.event.defaultPrevented) return;

                        var nodeSize = 10, clusterSize = 150;
                        if(params.enableAutoFocus && d["entity_type"] === "cluster" && !d.focused) {
                            //Remove last focused
                            var focused = d3.select(".nodes.focused");
                            var focusedData = focused.data();
                            focusedData = focusedData[0];
                            focusedData.focused = false;
                            focusedData.fixed = false;
                            focusedData.size = (clusterSize/2)*0.8;
                            focused.select("g")
                                .attr("transform", "scale(0.8, 0.8)");
                            for(var node in focusedData.nodes){
                                focusedData.nodes[node].parentFocused = false;
                                focusedData.nodes[node].size = (nodeSize/2) * 0.8;
                            }
                            focused.classed("focused", false);
                            d3.selectAll(".nodes.node.parentFocused").classed("parentFocused", false);

                            //Add new focused
                            focused = d3.select(this);
                            focusedData = focused.data();
                            focusedData = focusedData[0];
                            focusedData.focused = true;
                            focusedData.fixed = true;
                            focusedData.size = (clusterSize/2)*1;
                            focused.select("g")
                                .attr("transform", "scale(1, 1)");
                            for(var node in focusedData.nodes){
                                focusedData.nodes[node].parentFocused = true;
                                focusedData.nodes[node].size = (nodeSize/2) * 1;
                            }
                            focused.classed("focused", true);
                            d3.selectAll(".nodes.node")
                                .each(function(d) {
                                    if(d.parentFocused) {
                                        d3.select(this)
                                            .classed("parentFocused", true)
                                    }
                                });

                            runForceSimulation(true);
                            if (params.events.inFocus) {
                                params.events.inFocus.call(focused, focusedData);
                            }
                        } else if((d.focused || !params.enableAutoFocus) && params.events.initiate) {
                            params.events.initiate.call(d3.select(this), d);
                        }

                        if(params.events.clusterClick) {
                            params.events.clusterClick.call(d3.select(this), d);
                        }
                    });

                $node
                    .call(function(nodes) {
                        nodes.each(function(d) {
                            if (d['entity_type'] === 'cluster' && d.update != null) {
                                /*var namespaces = _.chain(d['xdr_info']).map(function(xdr_info) {
                                        return xdr_info.shipping_namespaces;
                                    })*/
                                //namespaces of cluster
                                var namespaces = _.chain(d['namespaces']).map(function(namespace) {
                                        return namespace;
                                    })
                                    .flatten()
                                    .uniq()
                                    .map(function(namespace) {
                                        return {
                                            name: namespace,
                                            value: 1
                                        };
                                    })
                                    .value();

                                if (namespaces.length === 0) {
                                    namespaces.push({
                                        name: "",
                                        value: 1
                                    });
                                }

                                d.update(namespaces);
                            } else {
                                d3.select(this)
                                    .select("g").attr("class", function(){
                                    return (this.getAttribute("class") ? this.getAttribute("class").replace(/ *(on|off) */, "") : "") + " " + d.status;
                                })
                            }
                        });
                    });

                $node
                    .exit()
                    .remove();

                $node.filter(".node")
                    .on("mouseover", params.events.nodeOver)
                    .on("click", params.events.nodeClick);

                $node.filter(".node")
                    .on("mouseout", params.events.nodeOut);

                if (allowDragging) {
                    $node.call(force.drag);
                }

                runAnimation();
            }

            function makeDirections(container, line) {
                container = d3.select(container)
                    .insert("g", line + "+line, " + line + "+g")
                    .attr("class", "xdr-directions")
                    .attr("opacity", 1);

                var innerContainer = container.append("g")
                    .attr("transform", "rotate(0)");

                innerContainer
                    .append("path")
                    .attr("d", "M0,0 l10,-12 l-4,0 l-6,8 l-6,-8 l-4,0 z");

                innerContainer
                    .append("path")
                    .attr("d", "M0,-8 l10,-12 l-4,0 l-6,8 l-6,-8 l-4,0 z");

                return container;
            }

            function updateDomPositionalData() {
                $node.attr("transform", function(d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });

                $link.attr("d", function(d){
                    var sX = d.source.x, sY = d.source.y, tX = d.target.x, tY = d.target.y;
                    var temp = (tY - sY)/(tX - sX);
                    temp = !isNaN(temp) ? temp : 0;
                    var theta = Math.atan(temp);
                    var angle = 180 * theta / Math.PI;
                    angle = !isNaN(angle) ? angle : 0;
                    theta = Math.abs(theta);

                    sX = sX + d.source.size * Math.cos(theta) * (d.source.x <= d.target.x ? 1 : -1);
                    sY = sY + d.source.size * Math.sin(theta) * (d.source.y <= d.target.y ? 1 : -1);
                    tX = tX - d.target.size * Math.cos(theta) * (d.source.x <= d.target.x ? 1 : -1);
                    tY = tY - d.target.size * Math.sin(theta) * (d.source.y <= d.target.y ? 1 : -1);

                    if(d.type === "cluster-node" || (d.type === "cluster-cluster" && d.direction === "omni")){
                        return "M"+sX+","+sY+" "+tX+","+tY;
                    } else {
                        var delta = Math.sqrt(Math.pow((tX - sX), 2) + Math.pow((tY - sY), 2));
                        return "M"+sX+","+sY+" a"+delta+",60 "+angle+" 0 1 "+(tX - sX)+","+(tY - sY);
                    }
                })
            }

            function runAnimation(forceRunning) {
                if(animationTimer == null && animate()) {
                    animationTimer = setInterval(function(){
                        if(!animate()){
                            clearInterval(animationTimer);
                            animationTimer = null;
                        }
                    }, 5000);
                }
            }

            function inProgressAnimation(element){
                element = d3.select(element);

                element.insert("circle", ":first-child")
                    .attr("fill", "#000")
                    .attr("r", 0)
                    .attr("opacity", 0.5)
                    .transition()
                        .duration(1000)
                        .attr("r", 150)
                        .attr("opacity", 0)
                        .each("end", function() {
                            this.remove();
                        });

                element.insert("circle", ":first-child")
                    .attr("fill", "#000")
                    .attr("r", 0)
                    .attr("opacity", 0.5)
                    .transition()
                        .delay(100)
                        .duration(1000)
                        .attr("r", 150)
                        .attr("opacity", 0)
                        .each("end", function() {
                            this.remove();
                        });
            }

            function animate() {
                var haveSomethingToAnimate = false;
                var radian = 180 / Math.PI;
                console.log("Animation tick");

                var pulseColor = ["#388C6F", "#56CCA3"];

                //XDR links animation
                var xdrLinks = d3.selectAll(".xdr-link");

                d3.selectAll(".shipping-namespaces").remove();

                xdrLinks.each(function(d) {
                    d3.select("svg.multi-cluster")
                        .append("text")
                        .attr("class", "shipping-namespaces")
                        .attr("text-anchor", "start")
                        .attr("dy", "-5")
                        .attr("dx", "5")
                        /*.attr("opacity", 0)*/
                            .append("textPath")
                            .attr("xlink:href", "#" + (d.source[d.source['entity_type'] + "_id"] + "-" + d.target[d.target['entity_type'] + "_id"]))
                            .text(function(){
                                var namespaces = typeof(d.source.xdr_info[d.target["cluster_id"]]) !== "undefined" ? d.source.xdr_info[d.target["cluster_id"]].shipping_namespaces.join(", ") : "";
                                var length = namespaces.length;
                                if(length >= 10){
                                    namespaces = namespaces.substring(0, 10);
                                    namespaces += "..."
                                }
                                return namespaces;
                            });
                });

                var text = d3.selectAll(".shipping-namespaces");

                xdrLinks
                    .transition()
                    .duration(2000)
                    .style("stroke", pulseColor[1])
                    .style("stroke-width", "4px")
                    .delay(1000)
                    .transition()
                    .duration(2000)
                    .style("stroke", pulseColor[0])
                    .style("stroke-width", "3px");

                /*text
                    .transition()
                    .duration(1000)
                    .attr("opacity", 1);
                    .transition()
                    .delay(3000)
                    .duration(1000)
                    .attr("opacity", 0)
                    .each("end", function(){
                        text.remove();
                    });*/

                $node
                    .each(function(d) {
                        if(d.discovery === "available"){
                            inProgressAnimation(this);
                        }
                    })

                return !!xdrLinks[0].length;
            }

            return updateGraph;
        }
    });

    return MultiClusterView;
});
