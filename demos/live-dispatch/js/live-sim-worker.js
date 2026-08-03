/*
 * Live dispatch simulation worker. Builds a routing graph from the region's
 * OSM arterial roads (primary/secondary/tertiary -- residential is drawn as
 * background texture only, not routed on) and runs a lightweight, seeded
 * dispatch heuristic (nearest available rider + bundle cap + deadline
 * priority) over synthetic orders, moving riders along real road polylines.
 *
 * This is a light heuristic, not the lab's CP-SAT two-phase solver -- see
 * the honesty box on the page. Real solver numbers are a separate, static
 * "measured" card the page renders from baked lab results, not from this
 * worker.
 *
 * Wall-clock throttled (see WORKER_TICK_MS): every tick is a fixed real-time
 * interval, never an iteration-count loop -- an earlier bug in this same
 * demo family (decision-os solver worker) showed that iteration-count-based
 * postMessage throttling can flood the main thread once the loop runs fast.
 */
"use strict";

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

var WORKER_TICK_MS = 300; // wall-clock cadence, fixed
var TICK_SIM_SECONDS_BASE = 1.5; // "1~2초 가상시간" per tick at speed=1x
var RIDER_SPEED_MPS = 7.0; // ~25km/h, e-bike/scooter delivery pace
var BUNDLE_CAPACITY = 3;
var PROMISE_WINDOW_MIN = 35;
var N_RESTAURANTS = 6;
var N_RIDERS = 9;
var ORDER_RATE_PER_SIM_SEC = 1 / 26; // ~1 new order every 26 virtual seconds

var ARTERIAL = { primary: true, secondary: true, tertiary: true };

// ---------------------------------------------------------------------
// geo helpers (equirectangular, fine for a bbox this small)
// ---------------------------------------------------------------------
var geo = null; // {mPerDegLon, mPerDegLat}

function setGeo(bbox) {
  var centerLatRad = ((bbox.north + bbox.south) / 2) * (Math.PI / 180);
  geo = { mPerDegLon: 111320 * Math.cos(centerLatRad), mPerDegLat: 110540 };
}
function distM(a, b) {
  var dx = (a.lon - b.lon) * geo.mPerDegLon;
  var dy = (a.lat - b.lat) * geo.mPerDegLat;
  return Math.sqrt(dx * dx + dy * dy);
}

// ---------------------------------------------------------------------
// routing graph (arterial roads only)
// ---------------------------------------------------------------------
function buildGraph(roads) {
  var nodeIndex = {};
  var nodes = [];
  var adj = [];
  function getNode(lon, lat) {
    var key = lon + "," + lat;
    var id = nodeIndex[key];
    if (id === undefined) {
      id = nodes.length;
      nodes.push({ lon: lon, lat: lat });
      adj.push([]);
      nodeIndex[key] = id;
    }
    return id;
  }
  for (var r = 0; r < roads.length; r++) {
    var road = roads[r];
    if (!ARTERIAL[road.highway]) continue;
    var coords = road.coords;
    for (var i = 1; i < coords.length; i++) {
      var a = getNode(coords[i - 1][0], coords[i - 1][1]);
      var b = getNode(coords[i][0], coords[i][1]);
      var d = distM(nodes[a], nodes[b]);
      if (d <= 0) continue;
      adj[a].push({ to: b, dist: d });
      adj[b].push({ to: a, dist: d });
    }
  }
  return { nodes: nodes, adj: adj };
}

function nearestNode(graph, pt) {
  var best = 0,
    bestD = Infinity;
  for (var i = 0; i < graph.nodes.length; i++) {
    var d = distM(graph.nodes[i], pt);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

// simple Dijkstra -- graph sizes here are a few hundred to ~2500 nodes and
// this only runs when an order is newly dispatched (not every tick), so a
// plain array scan (no binary heap) is fast enough and much simpler.
function shortestPath(graph, fromId, toId) {
  var n = graph.nodes.length;
  var dist = new Array(n).fill(Infinity);
  var prev = new Array(n).fill(-1);
  var visited = new Array(n).fill(false);
  dist[fromId] = 0;
  for (var iter = 0; iter < n; iter++) {
    var u = -1,
      best = Infinity;
    for (var i = 0; i < n; i++) {
      if (!visited[i] && dist[i] < best) {
        best = dist[i];
        u = i;
      }
    }
    if (u === -1 || u === toId) break;
    visited[u] = true;
    var edges = graph.adj[u];
    for (var e = 0; e < edges.length; e++) {
      var v = edges[e].to;
      var nd = dist[u] + edges[e].dist;
      if (nd < dist[v]) {
        dist[v] = nd;
        prev[v] = u;
      }
    }
  }
  if (dist[toId] === Infinity) return null;
  var path = [];
  var cur = toId;
  while (cur !== -1) {
    path.push(graph.nodes[cur]);
    cur = prev[cur];
  }
  path.reverse();
  return { path: path, dist: dist[toId] };
}

function routeBetween(graph, from, to) {
  var a = nearestNode(graph, from);
  var b = nearestNode(graph, to);
  var res = shortestPath(graph, a, b);
  if (!res) return { path: [from, to], dist: distM(from, to) };
  // stitch the true endpoints onto the snapped path so entities sit at
  // their real coordinates, not the nearest road vertex
  var path = [from].concat(res.path, [to]);
  var d = distM(from, res.path[0]) + res.dist + distM(res.path[res.path.length - 1], to);
  return { path: path, dist: d };
}

// ---------------------------------------------------------------------
// simulation state
// ---------------------------------------------------------------------
var STATE = null;

function makeRestaurant(id, pt) {
  return { id: id, lon: pt.lon, lat: pt.lat };
}

function initSim(region, roads, bbox, seed) {
  setGeo(bbox);
  var graph = buildGraph(roads);
  var rng = mulberry32(seed);

  var restaurants = [];
  for (var i = 0; i < N_RESTAURANTS && i < graph.nodes.length; i++) {
    var idx = Math.floor(rng() * graph.nodes.length);
    restaurants.push(makeRestaurant("R" + (i + 1), graph.nodes[idx]));
  }

  var riders = [];
  for (var j = 0; j < N_RIDERS; j++) {
    var ridx = Math.floor(rng() * graph.nodes.length);
    var pos = graph.nodes[ridx];
    riders.push({
      id: "D" + (j + 1),
      lon: pos.lon,
      lat: pos.lat,
      path: [],
      pathDist: [],
      pathTotal: 0,
      progress: 0,
      stops: [], // {order_id, kind, atDist}
      offline: false,
      offlineAfterCurrent: false,
      distanceTraveled: 0,
    });
  }

  STATE = {
    region: region,
    graph: graph,
    rng: rng,
    seed: seed,
    restaurants: restaurants,
    riders: riders,
    pending: [], // order objects awaiting dispatch
    orders: {}, // id -> order object (all, for lookup)
    simSeconds: 0,
    nextOrderAtSec: expoNext(rng),
    orderCounter: 0,
    playing: true,
    speed: 3,
    kpi: {
      unassigned: 0,
      delivered: 0,
      reassigned: 0,
      totalDistanceKm: 0,
      avgDeliveryMin: 0,
      deliveryMinSum: 0,
    },
  };
}

var MAX_ORDER_GAP_SEC = 70; // clamp: raw exponential draws are fat-tailed and
// can occasionally produce a very large gap (tens of seconds), which would
// silently stall the "live" demo for a long stretch with no visible
// activity -- cap it so the worst case still feels live.

function expoNext(rng) {
  var u = Math.max(1e-6, rng());
  return Math.min(-Math.log(u) / ORDER_RATE_PER_SIM_SEC, MAX_ORDER_GAP_SEC);
}

function spawnOrder() {
  var s = STATE;
  var rest = s.restaurants[Math.floor(s.rng() * s.restaurants.length)];
  var dropIdx = Math.floor(s.rng() * s.graph.nodes.length);
  var drop = s.graph.nodes[dropIdx];
  s.orderCounter++;
  var order = {
    id: "O" + s.orderCounter,
    restaurant_id: rest.id,
    pickup: { lon: rest.lon, lat: rest.lat },
    dropoff: { lon: drop.lon, lat: drop.lat },
    createdSec: s.simSeconds,
    deadlineSec: s.simSeconds + PROMISE_WINDOW_MIN * 60,
    status: "pending", // pending -> assigned -> picked_up -> delivered
    riderId: null,
  };
  s.orders[order.id] = order;
  s.pending.push(order);
}

function riderQueueLen(rider) {
  return rider.stops.length;
}
function riderAvailable(rider) {
  return !rider.offline && !rider.offlineAfterCurrent && riderQueueLen(rider) < BUNDLE_CAPACITY * 2;
}
function riderTailPos(rider) {
  if (rider.path.length > 0) return rider.path[rider.path.length - 1];
  return { lon: rider.lon, lat: rider.lat };
}

function appendOrderToRider(rider, order) {
  var s = STATE;
  var tail = riderTailPos(rider);
  var toPickup = routeBetween(s.graph, tail, order.pickup);
  var startAt = rider.pathTotal;
  rider.path = rider.path.concat(toPickup.path.slice(rider.path.length ? 1 : 0));
  rider.pathTotal += toPickup.dist;
  rider.stops.push({ order_id: order.id, kind: "pickup", atDist: rider.pathTotal });

  var toDrop = routeBetween(s.graph, order.pickup, order.dropoff);
  rider.path = rider.path.concat(toDrop.path.slice(1));
  rider.pathTotal += toDrop.dist;
  rider.stops.push({ order_id: order.id, kind: "dropoff", atDist: rider.pathTotal });

  order.status = "assigned";
  order.riderId = rider.id;
}

function dispatchTick() {
  var s = STATE;
  if (s.pending.length === 0) return;
  // deadline-first priority
  s.pending.sort(function (a, b) {
    return a.deadlineSec - b.deadlineSec;
  });
  var stillPending = [];
  for (var i = 0; i < s.pending.length; i++) {
    var order = s.pending[i];
    var best = null,
      bestCost = Infinity;
    for (var r = 0; r < s.riders.length; r++) {
      var rider = s.riders[r];
      if (!riderAvailable(rider)) continue;
      var tail = riderTailPos(rider);
      var cost = distM(tail, order.pickup) + riderQueueLen(rider) * 60; // light bundle-load penalty
      if (cost < bestCost) {
        bestCost = cost;
        best = rider;
      }
    }
    if (best) {
      appendOrderToRider(best, order);
    } else {
      stillPending.push(order);
    }
  }
  s.pending = stillPending;
}

function moveRiders(dtSimSec) {
  var s = STATE;
  var stepM = RIDER_SPEED_MPS * dtSimSec;
  for (var r = 0; r < s.riders.length; r++) {
    var rider = s.riders[r];
    if (rider.path.length < 2) continue;
    rider.progress += stepM;
    rider.distanceTraveled += stepM;

    // resolve any stops we've now passed
    while (rider.stops.length > 0 && rider.progress >= rider.stops[0].atDist) {
      var stop = rider.stops.shift();
      var order = s.orders[stop.order_id];
      if (!order) continue;
      if (stop.kind === "pickup") order.status = "picked_up";
      else if (stop.kind === "dropoff") {
        order.status = "delivered";
        var mins = (s.simSeconds - order.createdSec) / 60;
        s.kpi.delivered++;
        s.kpi.deliveryMinSum += mins;
      }
    }

    // walk position along the polyline to `progress` meters
    var acc = 0,
      placed = false;
    for (var i = 1; i < rider.path.length; i++) {
      var segD = distM(rider.path[i - 1], rider.path[i]);
      if (acc + segD >= rider.progress || i === rider.path.length - 1) {
        var segFrac = segD > 0 ? (rider.progress - acc) / segD : 0;
        segFrac = Math.max(0, Math.min(1, segFrac));
        rider.lon = rider.path[i - 1].lon + (rider.path[i].lon - rider.path[i - 1].lon) * segFrac;
        rider.lat = rider.path[i - 1].lat + (rider.path[i].lat - rider.path[i - 1].lat) * segFrac;
        placed = true;
        break;
      }
      acc += segD;
    }
    if (!placed && rider.path.length > 0) {
      var last = rider.path[rider.path.length - 1];
      rider.lon = last.lon;
      rider.lat = last.lat;
    }

    // route exhausted -> idle at final point, ready for next assignment
    if (rider.progress >= rider.pathTotal && rider.stops.length === 0) {
      rider.path = [];
      rider.pathDist = [];
      rider.pathTotal = 0;
      rider.progress = 0;
      if (rider.offlineAfterCurrent) rider.offline = true;
    }
  }
}

function applyDropout() {
  var s = STATE;
  var activeIds = s.riders.filter(function (r) {
    return !r.offline;
  });
  var n = Math.max(1, Math.round(activeIds.length * 0.2));
  var shuffled = activeIds.slice();
  for (var i = shuffled.length - 1; i > 0; i--) {
    var j = Math.floor(s.rng() * (i + 1));
    var tmp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = tmp;
  }
  var chosen = shuffled.slice(0, n);
  chosen.forEach(function (rider) {
    // keep only stops for orders already picked up (finish those), drop
    // future pickups back into the pending pool so they visibly get
    // reassigned to a still-active rider.
    var keepStops = [];
    var cutoffDist = null;
    for (var k = 0; k < rider.stops.length; k++) {
      var stop = rider.stops[k];
      var order = s.orders[stop.order_id];
      if (order && order.status === "picked_up") {
        keepStops.push(stop);
      } else if (order && stop.kind === "pickup" && order.status === "assigned") {
        if (cutoffDist === null) cutoffDist = stop.atDist;
        order.status = "pending";
        order.riderId = null;
        s.pending.push(order);
        s.kpi.reassigned++;
      }
    }
    rider.stops = keepStops;
    if (cutoffDist !== null) {
      // truncate the path at the cutoff so the rider doesn't visually
      // drive toward a pickup it no longer owns
      rider.pathTotal = Math.min(rider.pathTotal, cutoffDist);
    }
    rider.offlineAfterCurrent = true;
    if (rider.path.length === 0) rider.offline = true;
  });
}

function snapshot() {
  var s = STATE;
  s.kpi.unassigned = s.pending.length;
  s.kpi.avgDeliveryMin = s.kpi.delivered > 0 ? s.kpi.deliveryMinSum / s.kpi.delivered : 0;
  var totalM = 0;
  for (var r = 0; r < s.riders.length; r++) totalM += s.riders[r].distanceTraveled;
  s.kpi.totalDistanceKm = totalM / 1000;

  return {
    type: "snapshot",
    simSeconds: s.simSeconds,
    riders: s.riders.map(function (r) {
      return {
        id: r.id,
        lon: r.lon,
        lat: r.lat,
        offline: r.offline,
        offlineAfterCurrent: r.offlineAfterCurrent,
        carrying: r.stops.filter(function (st) {
          return st.kind === "dropoff";
        }).length,
      };
    }),
    restaurants: s.restaurants,
    pendingOrders: s.pending.map(function (o) {
      return { id: o.id, lon: o.dropoff.lon, lat: o.dropoff.lat };
    }),
    kpi: s.kpi,
  };
}

var intervalHandle = null;

function tick() {
  var s = STATE;
  if (!s || !s.playing) return;
  var dtSim = TICK_SIM_SECONDS_BASE * s.speed;
  s.simSeconds += dtSim;
  while (s.simSeconds >= s.nextOrderAtSec) {
    spawnOrder();
    s.nextOrderAtSec += expoNext(s.rng);
  }
  dispatchTick();
  moveRiders(dtSim);
  self.postMessage(snapshot());
}

self.onmessage = function (evt) {
  var msg = evt.data;
  if (msg.cmd === "init") {
    initSim(msg.region, msg.roads, msg.bbox, msg.seed);
    if (intervalHandle) clearInterval(intervalHandle);
    intervalHandle = setInterval(tick, WORKER_TICK_MS);
    self.postMessage(snapshot());
  } else if (msg.cmd === "play") {
    if (STATE) STATE.playing = true;
  } else if (msg.cmd === "pause") {
    if (STATE) STATE.playing = false;
  } else if (msg.cmd === "speed") {
    if (STATE) STATE.speed = msg.value;
  } else if (msg.cmd === "dropout") {
    if (STATE) applyDropout();
  } else if (msg.cmd === "stop") {
    if (intervalHandle) {
      clearInterval(intervalHandle);
      intervalHandle = null;
    }
    STATE = null;
  }
};
