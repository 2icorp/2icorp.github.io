/*
 * Small simulated-annealing scheduler that runs inside a Web Worker so the
 * main thread never blocks. Ported from (and structurally identical to)
 * the seeded local-search engine already used by this site's own
 * demos/19-nurse-roster page -- there is no ws-lab/metaheuristic/sa.py or
 * objective.py in this repo to port from (checked: that path does not
 * exist), so this reuses the closest real analogue: the SA loop this site
 * already ships for nurse rostering, generalized into a standalone worker
 * for a smaller 10-employee / 14-day instance.
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

var COVER_WEIGHT = 40; // 커버리지 부족 1인당 벌점
var FAIRNESS_WEIGHT = 3; // 야간 근무 분산 벌점
var WEEKLY_MAX_WORKDAYS = 5;

function buildInstance(seed, N, D) {
  var rng = mulberry32(seed);
  var need = [];
  for (var d = 0; d < D; d++) {
    // a mild demand wave so the instance is not perfectly uniform
    var wave = Math.sin((d / D) * Math.PI * 2) * 0.6;
    need.push({
      D: Math.max(1, Math.round(3 + wave)),
      E: Math.max(1, Math.round(2 + wave * 0.6)),
      N: Math.max(1, Math.round(1 + Math.max(0, wave) * 0.5)),
    });
  }
  var requestedOff = [];
  for (var n = 0; n < N; n++) {
    var row = new Array(D).fill(false);
    var offDay = Math.floor(rng() * D);
    row[offDay] = true;
    requestedOff.push(row);
  }
  return { N: N, D: D, need: need, requestedOff: requestedOff, maxConsec: 5 };
}

function pairOK(prev, cur) {
  return !(prev === "N" && cur === "D");
}
function restOK(schedule, n, d, newShift, D) {
  if (d > 0 && !pairOK(schedule[n][d - 1], newShift)) return false;
  if (d < D - 1 && !pairOK(newShift, schedule[n][d + 1])) return false;
  return true;
}
function consecRunOK(schedule, n, d, newShift, maxConsec, D) {
  if (newShift === "O") return true;
  var run = 1;
  var i = d - 1;
  while (i >= 0 && schedule[n][i] !== "O") {
    run++;
    i--;
  }
  var j = d + 1;
  while (j < D && schedule[n][j] !== "O") {
    run++;
    j++;
  }
  return run <= maxConsec;
}
function weeklyOK(schedule, n, d, newShift, D) {
  if (D < 7) return true;
  var startMin = Math.max(0, d - 6);
  var startMax = Math.min(d, D - 7);
  for (var start = startMin; start <= startMax; start++) {
    var cnt = 0;
    for (var k = start; k < start + 7; k++) {
      var s = k === d ? newShift : schedule[n][k];
      if (s !== "O") cnt++;
    }
    if (cnt > WEEKLY_MAX_WORKDAYS) return false;
  }
  return true;
}
function isValidAssign(schedule, n, d, newShift, ctx) {
  if (ctx.requestedOff[n][d] && newShift !== "O") return false;
  if (!restOK(schedule, n, d, newShift, ctx.D)) return false;
  if (!consecRunOK(schedule, n, d, newShift, ctx.maxConsec, ctx.D)) return false;
  if (!weeklyOK(schedule, n, d, newShift, ctx.D)) return false;
  return true;
}

function initGreedy(ctx) {
  var N = ctx.N,
    D = ctx.D;
  var schedule = [];
  for (var n = 0; n < N; n++) schedule.push(new Array(D).fill("O"));
  var order = ["D", "E", "N"];
  for (var d = 0; d < D; d++) {
    for (var oi = 0; oi < order.length; oi++) {
      var shift = order[oi];
      var required = ctx.need[d][shift];
      var candidates = [];
      for (var n2 = 0; n2 < N; n2++) {
        if (schedule[n2][d] !== "O") continue;
        if (ctx.requestedOff[n2][d]) continue;
        candidates.push(n2);
      }
      candidates.sort(function () {
        return ctx.rng() - 0.5;
      });
      var assigned = 0;
      for (var ci = 0; ci < candidates.length && assigned < required; ci++) {
        var cand = candidates[ci];
        if (isValidAssign(schedule, cand, d, shift, ctx)) {
          schedule[cand][d] = shift;
          assigned++;
        }
      }
    }
  }
  return schedule;
}

function quickCost(schedule, ctx) {
  var N = ctx.N,
    D = ctx.D;
  var deficitTotal = 0;
  for (var d = 0; d < D; d++) {
    var cD = 0,
      cE = 0,
      cN = 0;
    for (var n = 0; n < N; n++) {
      var s = schedule[n][d];
      if (s === "D") cD++;
      else if (s === "E") cE++;
      else if (s === "N") cN++;
    }
    var req = ctx.need[d];
    deficitTotal += Math.max(0, req.D - cD) + Math.max(0, req.E - cE) + Math.max(0, req.N - cN);
  }
  var nightCounts = new Array(N).fill(0);
  for (var n2 = 0; n2 < N; n2++) for (var d2 = 0; d2 < D; d2++) if (schedule[n2][d2] === "N") nightCounts[n2]++;
  var mean = nightCounts.reduce(function (a, b) {
    return a + b;
  }, 0) / N;
  var varSum = 0;
  for (var n3 = 0; n3 < N; n3++) varSum += (nightCounts[n3] - mean) * (nightCounts[n3] - mean);
  return deficitTotal * COVER_WEIGHT + varSum * FAIRNESS_WEIGHT;
}

function evaluateFull(schedule, ctx) {
  var N = ctx.N,
    D = ctx.D;
  var deficitTotal = 0;
  for (var d = 0; d < D; d++) {
    var counts = { D: 0, E: 0, N: 0 };
    for (var n = 0; n < N; n++) {
      var s = schedule[n][d];
      if (s === "D" || s === "E" || s === "N") counts[s]++;
    }
    ["D", "E", "N"].forEach(function (shift) {
      deficitTotal += Math.max(0, ctx.need[d][shift] - counts[shift]);
    });
  }
  var totalNeed = 0;
  for (var d2 = 0; d2 < D; d2++) totalNeed += ctx.need[d2].D + ctx.need[d2].E + ctx.need[d2].N;
  var coveragePct = totalNeed > 0 ? Math.max(0, Math.min(100, (1 - deficitTotal / totalNeed) * 100)) : 100;
  return { deficitTotal: deficitTotal, coveragePct: coveragePct };
}

function proposeMove(schedule, ctx) {
  if (ctx.rng() < 0.7) {
    var n = Math.floor(ctx.rng() * ctx.N);
    var d = Math.floor(ctx.rng() * ctx.D);
    if (ctx.requestedOff[n][d]) return null;
    var choices = ["D", "E", "N", "O"];
    var newShift = choices[Math.floor(ctx.rng() * 4)];
    if (newShift === schedule[n][d]) return null;
    if (!isValidAssign(schedule, n, d, newShift, ctx)) return null;
    return { type: "set", n: n, d: d, oldShift: schedule[n][d], newShift: newShift };
  }
  var d2 = Math.floor(ctx.rng() * ctx.D);
  var n1 = Math.floor(ctx.rng() * ctx.N);
  var n2 = Math.floor(ctx.rng() * ctx.N);
  if (n1 === n2) return null;
  if (ctx.requestedOff[n1][d2] || ctx.requestedOff[n2][d2]) return null;
  var s1 = schedule[n1][d2],
    s2 = schedule[n2][d2];
  if (s1 === s2) return null;
  if (!isValidAssign(schedule, n1, d2, s2, ctx)) return null;
  if (!isValidAssign(schedule, n2, d2, s1, ctx)) return null;
  return { type: "swap", n1: n1, n2: n2, d: d2, s1: s1, s2: s2 };
}
function applyMove(schedule, move) {
  if (move.type === "set") schedule[move.n][move.d] = move.newShift;
  else {
    schedule[move.n1][move.d] = move.s2;
    schedule[move.n2][move.d] = move.s1;
  }
}
function undoMove(schedule, move) {
  if (move.type === "set") schedule[move.n][move.d] = move.oldShift;
  else {
    schedule[move.n1][move.d] = move.s1;
    schedule[move.n2][move.d] = move.s2;
  }
}

self.onmessage = function (evt) {
  var msg = evt.data;
  if (msg.cmd !== "solve") return;

  var seed = msg.seed || 20260803;
  var N = msg.N || 10;
  var D = msg.D || 14;
  var timeBudgetMs = msg.timeBudgetMs || 2000;

  var ctx = buildInstance(seed, N, D);
  ctx.rng = mulberry32(seed + 999);

  var schedule = initGreedy(ctx);
  var currentCost = quickCost(schedule, ctx);
  var bestSchedule = schedule.map(function (row) {
    return row.slice();
  });
  var bestCost = currentCost;

  var T0 = COVER_WEIGHT * 0.35;
  var startTime = Date.now();
  var iter = 0;
  var lastPostTime = startTime;
  var POST_INTERVAL_MS = 90; // wall-clock throttle, not iteration-count -- a
  // tight cost-eval loop can run into the hundreds of thousands of
  // iterations within the time budget; posting every N *iterations*
  // floods the main thread with postMessage + SVG-rebuild work and the
  // resulting backlog freezes the page long after the worker is done.
  var MAX_HISTORY = 40;
  var history = [];

  function elapsedFrac() {
    return Math.min(1, (Date.now() - startTime) / timeBudgetMs);
  }

  while (Date.now() - startTime < timeBudgetMs) {
    var move = proposeMove(schedule, ctx);
    if (move) {
      var before = currentCost;
      applyMove(schedule, move);
      var after = quickCost(schedule, ctx);
      var delta = after - before;
      var accept = delta <= 0;
      if (!accept) {
        var T = T0 * Math.max(0, 1 - elapsedFrac());
        if (T > 0.001) {
          var prob = Math.exp(-delta / Math.max(T, 0.001));
          if (ctx.rng() < prob) accept = true;
        }
      }
      if (accept) {
        currentCost = after;
        if (currentCost < bestCost) {
          bestCost = currentCost;
          bestSchedule = schedule.map(function (row) {
            return row.slice();
          });
        }
      } else {
        undoMove(schedule, move);
      }
    }
    iter++;
    var now = Date.now();
    if (now - lastPostTime >= POST_INTERVAL_MS && history.length < MAX_HISTORY) {
      lastPostTime = now;
      history.push({ iter: iter, cost: currentCost, best: bestCost });
      self.postMessage({ type: "progress", iter: iter, cost: currentCost, best: bestCost, fracTime: elapsedFrac() });
    }
  }

  var finalRes = evaluateFull(bestSchedule, ctx);
  self.postMessage({
    type: "done",
    iter: iter,
    grid: bestSchedule,
    cost: bestCost,
    history: history,
    coveragePct: finalRes.coveragePct,
    deficitTotal: finalRes.deficitTotal,
    need: ctx.need,
  });
};
