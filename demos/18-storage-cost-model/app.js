(function(){
"use strict";

var SVGNS = "http://www.w3.org/2000/svg";
var CLASSES = ["standard", "infrequent", "archive", "deepArchive"];

function $(id){ return document.getElementById(id); }

// ---------------------------------------------------------------------
// formatting
// ---------------------------------------------------------------------
function fmtUSD0(n){
  if(!isFinite(n)) return "-";
  return "$" + Math.round(n).toLocaleString("en-US");
}
function fmtUSD1(n){
  if(!isFinite(n)) return "-";
  return "$" + n.toLocaleString("en-US", {minimumFractionDigits:1, maximumFractionDigits:1});
}
function fmtUSD2(n){
  if(!isFinite(n)) return "-";
  return "$" + n.toLocaleString("en-US", {minimumFractionDigits:2, maximumFractionDigits:2});
}
function fmtPct1(n){
  if(!isFinite(n)) return "-";
  return n.toLocaleString("en-US", {minimumFractionDigits:1, maximumFractionDigits:1}) + "%";
}
function fmtKB(kb){
  if(!isFinite(kb)) return "-";
  if(kb >= 1e6) return (kb/1e6).toFixed(2) + " GB";
  if(kb >= 1000) return (kb/1000).toFixed(1) + " MB";
  return Math.round(kb).toLocaleString("en-US") + " KB";
}
function fmtRatio(n){
  if(!isFinite(n)) return "-";
  return n.toLocaleString("en-US", {minimumFractionDigits:2, maximumFractionDigits:2}) + "x";
}

// ---------------------------------------------------------------------
// input readers
// ---------------------------------------------------------------------
function readWorkload(){
  return {
    totalTB: parseFloat($("totalTB").value),
    objSizeKB: Math.pow(10, parseFloat($("objSize").value)),
    growthPct: parseFloat($("growth").value),
    retentionDays: parseFloat($("retention").value),
    readRatioPct: parseFloat($("readRatio").value),
    egressTB: parseFloat($("egress").value)
  };
}

function readCloudPricing(){
  var p = {};
  CLASSES.forEach(function(c){
    var transEl = $("price_transfee_" + c);
    p[c] = {
      storage: parseFloat($("price_storage_" + c).value) || 0,
      put: parseFloat($("price_put_" + c).value) || 0,
      get: parseFloat($("price_get_" + c).value) || 0,
      minDur: parseFloat($("price_min_" + c).value) || 0,
      transFee: transEl ? (parseFloat(transEl.value) || 0) : 0
    };
  });
  p.egress = parseFloat($("egressPrice").value) || 0;
  return p;
}

function getActiveYears(){
  var btns = document.querySelectorAll(".year-btn");
  for(var i=0;i<btns.length;i++){
    if(btns[i].getAttribute("aria-pressed") === "true") return parseInt(btns[i].dataset.years, 10);
  }
  return 3;
}

function readOnprem(){
  var parts = $("ecScheme").value.split("-");
  var k = parseFloat(parts[0]), m = parseFloat(parts[1]);
  return {
    hwPrice: parseFloat($("hwPrice").value),
    k: k, m: m,
    overhead: (k + m) / k,
    years: getActiveYears(),
    replacementRatePct: parseFloat($("replacementRate").value) || 0,
    monthlyOpex: parseFloat($("monthlyOpex").value) || 0
  };
}

// ---------------------------------------------------------------------
// cloud cost model (month-by-month, real simulation, no lookup tables)
// ---------------------------------------------------------------------
function computeCloudMonthlySeries(workload, pricing, months){
  var g = workload.growthPct / 100;
  var objBytes = workload.objSizeKB * 1000;
  var series = [];
  var total = 0;
  for(var t = 0; t < months; t++){
    var capTB = workload.totalTB * Math.pow(1 + g, t);
    var capBytes = capTB * 1e12;
    var newBytes = capBytes * g;
    var newObjects = objBytes > 0 ? newBytes / objBytes : 0;
    var readBytes = capBytes * (workload.readRatioPct / 100);
    var readObjects = objBytes > 0 ? readBytes / objBytes : 0;
    var egressTB = workload.egressTB * Math.pow(1 + g, t);

    var storageCost = capTB * 1000 * pricing.standard.storage;
    var putCost = (newObjects / 1000) * pricing.standard.put;
    var getCost = (readObjects / 1000) * pricing.standard.get;
    var egressCost = egressTB * 1000 * pricing.egress;
    var monthTotal = storageCost + putCost + getCost + egressCost;

    series.push({
      t: t, capTB: capTB, storageCost: storageCost, putCost: putCost,
      getCost: getCost, egressCost: egressCost, total: monthTotal
    });
    total += monthTotal;
  }
  return { series: series, total: total };
}

// ---------------------------------------------------------------------
// onprem TCO model
// ---------------------------------------------------------------------
function onpremTCOForPrice(hwPrice, workload, onprem, months){
  var g = workload.growthPct / 100;
  var peakTB = workload.totalTB * Math.pow(1 + g, months);
  var rawTB = peakTB * onprem.overhead;
  var hwCapex = rawTB * hwPrice;
  var replacementTotal = hwCapex * (onprem.replacementRatePct / 100) * (months / 12);
  return {
    total: hwCapex + onprem.monthlyOpex * months + replacementTotal,
    hwCapex: hwCapex, rawTB: rawTB, replacementTotal: replacementTotal
  };
}

function computeOnpremCumulative(hwPrice, workload, onprem, months){
  var r = onpremTCOForPrice(hwPrice, workload, onprem, months);
  var monthlyReplacement = r.hwCapex * (onprem.replacementRatePct / 100) / 12;
  var series = [];
  var cum = 0;
  for(var t = 0; t < months; t++){
    var monthCost = (t === 0 ? r.hwCapex : 0) + onprem.monthlyOpex + monthlyReplacement;
    cum += monthCost;
    series.push({ t: t, cum: cum });
  }
  return { series: series, total: r.total, hwCapex: r.hwCapex, rawTB: r.rawTB };
}

// linear bisection over hardware price
function bisectBreakeven(cloudTotal, workload, onprem, months){
  var lo = 0.01, hi = 5000;
  var fLo = onpremTCOForPrice(lo, workload, onprem, months).total - cloudTotal;
  var fHi = onpremTCOForPrice(hi, workload, onprem, months).total - cloudTotal;
  if(fLo > 0) return { price: null, always: "cloud" };
  if(fHi < 0) return { price: null, always: "onprem" };
  for(var i = 0; i < 80; i++){
    var mid = (lo + hi) / 2;
    var fMid = onpremTCOForPrice(mid, workload, onprem, months).total - cloudTotal;
    if(Math.abs(fMid) < 0.005){ return { price: mid }; }
    if(fMid < 0) lo = mid; else hi = mid;
  }
  return { price: (lo + hi) / 2 };
}

// ---------------------------------------------------------------------
// lifecycle transition model (per-TB, over full retention window)
// ---------------------------------------------------------------------
function costNoTransition(days, priceStandard){
  return (days / 30) * 1000 * priceStandard;
}

function costTransition(sizeKB, days, N, standardPricing, targetPricing){
  var effN = Math.min(N, days);
  var phase1 = (effN / 30) * 1000 * standardPricing.storage;
  var remainDays = Math.max(0, days - N);
  var transitioned = N < days;
  var phase2 = transitioned ? (remainDays / 30) * 1000 * targetPricing.storage : 0;
  var penaltyDays = transitioned ? Math.max(0, targetPricing.minDur - remainDays) : 0;
  var penalty = transitioned ? (penaltyDays / 30) * 1000 * targetPricing.storage : 0;
  var objectsPerTB = sizeKB > 0 ? 1e9 / sizeKB : 0; // 1e12 bytes / (sizeKB * 1000 bytes)
  var transitionCost = transitioned ? (objectsPerTB / 1000) * targetPricing.transFee : 0;
  var total = phase1 + phase2 + penalty + transitionCost;
  return { phase1: phase1, phase2: phase2, penalty: penalty, transitionCost: transitionCost, total: total };
}

function computeLifecycle(workload, pricing, transitionDay, targetClass){
  var days = workload.retentionDays;
  var sizeKB = workload.objSizeKB;
  var noTransition = costNoTransition(days, pricing.standard.storage);
  var trans = costTransition(sizeKB, days, transitionDay, pricing.standard, pricing[targetClass]);
  return {
    noTransition: noTransition,
    transition: trans.total,
    ratio: noTransition > 0 ? trans.total / noTransition : 0,
    breakdown: trans
  };
}

// log-scale bisection: find object size (KB) where transition/no-transition ratio crosses 1
function bisectReversalSize(workload, pricing, transitionDay, targetClass){
  var days = workload.retentionDays;
  var noTransition = costNoTransition(days, pricing.standard.storage);
  function ratioMinus1(sizeKB){
    var c = costTransition(sizeKB, days, transitionDay, pricing.standard, pricing[targetClass]);
    return noTransition > 0 ? (c.total / noTransition) - 1 : 0;
  }
  var lo = 1, hi = 1e7; // 1 KB .. 10 GB
  var fLo = ratioMinus1(lo), fHi = ratioMinus1(hi);
  if(fLo > 0 && fHi > 0) return { size: null, always: "worse" };
  if(fLo < 0 && fHi < 0) return { size: null, always: "better" };
  for(var i = 0; i < 80; i++){
    var mid = Math.sqrt(lo * hi);
    var fMid = ratioMinus1(mid);
    if(Math.abs(fMid) < 1e-6) return { size: mid };
    var sameSign = (fLo < 0 && fMid < 0) || (fLo > 0 && fMid > 0);
    if(sameSign){ lo = mid; fLo = fMid; } else { hi = mid; }
  }
  return { size: Math.sqrt(lo * hi) };
}

// ---------------------------------------------------------------------
// bill attribution
// ---------------------------------------------------------------------
function computeAttribution(workload, pricing, params, cloudMonth0){
  var capTB = workload.totalTB;
  var coldTB = capTB * params.coldPct / 100;
  var coldCost = coldTB * 1000 * Math.max(0, pricing.standard.storage - pricing.archive.storage);
  var snapTB = capTB * params.snapshotPct / 100;
  var snapCost = snapTB * 1000 * pricing.standard.storage;
  var overTB = capTB * params.overProvPct / 100;
  var overCost = overTB * 1000 * pricing.standard.storage;
  var egressCost = cloudMonth0.egressCost;
  var smallObjCost = cloudMonth0.putCost + cloudMonth0.getCost;
  var totalBill = cloudMonth0.total;

  var attributedRaw = coldCost + snapCost + overCost + egressCost + smallObjCost;
  var overflow = attributedRaw > totalBill + 0.0001;
  var attributed = overflow ? totalBill : attributedRaw;
  var unattributed = Math.max(0, totalBill - attributed);

  return {
    categories: [
      { key: "cold", label: "콜드 데이터 방치", cost: coldCost },
      { key: "snap", label: "스냅샷 누적", cost: snapCost },
      { key: "egress", label: "외부 전송", cost: egressCost },
      { key: "small", label: "소형 오브젝트 요청비", cost: smallObjCost },
      { key: "over", label: "과잉 프로비저닝", cost: overCost }
    ],
    totalBill: totalBill,
    attributed: attributed,
    unattributed: unattributed,
    attributionRate: totalBill > 0 ? (attributed / totalBill) * 100 : 0,
    overflow: overflow,
    percentSumOver100: (params.coldPct + params.snapshotPct + params.overProvPct) > 100
  };
}

// ---------------------------------------------------------------------
// svg helpers
// ---------------------------------------------------------------------
function svgEl(tag, attrs){
  var e = document.createElementNS(SVGNS, tag);
  for(var k in attrs){ if(attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]); }
  return e;
}
function clearSvg(svg){ while(svg.firstChild) svg.removeChild(svg.firstChild); }
function pathFromPoints(pts){
  return "M " + pts.map(function(p){ return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" L ");
}

function drawCumulativeChart(cloudSeries, onpremSeries, months){
  var svg = $("cumulativeChart");
  clearSvg(svg);
  var W = 900, H = 260, padL = 56, padR = 14, padT = 16, padB = 26;
  var innerW = W - padL - padR, innerH = H - padT - padB;

  var cloudCum = []; var running = 0;
  for(var i = 0; i < cloudSeries.length; i++){ running += cloudSeries[i].total; cloudCum.push(running); }
  var onpremCum = onpremSeries.map(function(s){ return s.cum; });

  var allVals = cloudCum.concat(onpremCum);
  var maxV = Math.max.apply(null, allVals) * 1.06;
  var minV = 0;
  var rangeV = (maxV - minV) || 1;

  function x(t){ return padL + innerW * t / (months - 1); }
  function y(v){ return padT + innerH - ((v - minV) / rangeV) * innerH; }

  var cloudPts = cloudCum.map(function(v, t){ return [x(t), y(v)]; });
  var onpremPts = onpremCum.map(function(v, t){ return [x(t), y(v)]; });

  var cloudPath = svgEl("path", { d: pathFromPoints(cloudPts), fill: "none", stroke: "var(--steel)", "stroke-width": "2.4" });
  svg.appendChild(cloudPath);
  var onpremPath = svgEl("path", { d: pathFromPoints(onpremPts), fill: "none", stroke: "var(--signal)", "stroke-width": "2.4", "stroke-dasharray": "6 5" });
  svg.appendChild(onpremPath);

  // crossover: first month where sign of (onprem - cloud) flips
  var crossT = -1;
  for(var t = 1; t < months; t++){
    var prevDiff = onpremCum[t-1] - cloudCum[t-1];
    var curDiff = onpremCum[t] - cloudCum[t];
    if((prevDiff > 0 && curDiff <= 0) || (prevDiff < 0 && curDiff >= 0)){ crossT = t; break; }
  }
  if(crossT >= 0){
    var cx = x(crossT), cy = y((onpremCum[crossT] + cloudCum[crossT]) / 2);
    svg.appendChild(svgEl("line", { x1: cx, y1: padT, x2: cx, y2: H - padB, stroke: "var(--line)", "stroke-width": "1", "stroke-dasharray": "3 3" }));
    svg.appendChild(svgEl("circle", { cx: cx, cy: cy, r: 4, fill: "var(--ink)" }));
  }

  // y axis labels (min, mid, max)
  [0, 0.5, 1].forEach(function(f){
    var v = minV + rangeV * f;
    var ty = y(v);
    var t = svgEl("text", { x: padL - 8, y: ty + 3, "text-anchor": "end", class: "axis-label" });
    t.textContent = "$" + Math.round(v).toLocaleString("en-US");
    svg.appendChild(t);
  });
  // x axis labels
  var step = Math.max(1, Math.round(months / 6));
  for(var m = 0; m < months; m += step){
    var lx = svgEl("text", { x: x(m), y: H - 6, "text-anchor": "middle", class: "axis-label" });
    lx.textContent = m + "개월";
    svg.appendChild(lx);
  }

  var note = $("crossoverNote");
  if(crossT >= 0){
    note.textContent = crossT + "개월차에서 누적 비용 우위가 바뀝니다(계산값).";
  } else {
    note.textContent = "선택한 " + months + "개월 구간에서는 교차가 없습니다(계산값).";
  }
}

function drawBreakevenChart(cloudTotal, workload, onprem, months, breakevenResult){
  var svg = $("breakevenChart");
  clearSvg(svg);
  var W = 900, H = 260, padL = 56, padR = 14, padT = 16, padB = 26;
  var innerW = W - padL - padR, innerH = H - padT - padB;

  var breakevenPrice = breakevenResult.price;
  var hiBound = breakevenPrice ? Math.max(breakevenPrice * 2.2, onprem.hwPrice * 1.6, 60) : Math.max(onprem.hwPrice * 2, 250);

  var N = 60;
  var pts = [];
  var maxOnprem = 0;
  for(var i = 0; i <= N; i++){
    var price = hiBound * i / N;
    var v = onpremTCOForPrice(price, workload, onprem, months).total;
    pts.push([price, v]);
    if(v > maxOnprem) maxOnprem = v;
  }
  var maxV = Math.max(maxOnprem, cloudTotal) * 1.06;

  function x(p){ return padL + innerW * p / hiBound; }
  function y(v){ return padT + innerH - (v / maxV) * innerH; }

  var onpremPts = pts.map(function(p){ return [x(p[0]), y(p[1])]; });
  svg.appendChild(svgEl("path", { d: pathFromPoints(onpremPts), fill: "none", stroke: "var(--signal)", "stroke-width": "2.4" }));

  var cloudY = y(cloudTotal);
  svg.appendChild(svgEl("line", { x1: padL, y1: cloudY, x2: W - padR, y2: cloudY, stroke: "var(--steel)", "stroke-width": "2.4" }));

  if(breakevenPrice !== null && breakevenPrice <= hiBound){
    var bx = x(breakevenPrice), by = y(cloudTotal);
    svg.appendChild(svgEl("line", { x1: bx, y1: padT, x2: bx, y2: H - padB, stroke: "var(--line)", "stroke-width": "1", "stroke-dasharray": "3 3" }));
    svg.appendChild(svgEl("circle", { cx: bx, cy: by, r: 5, fill: "var(--ink)" }));
  }

  // current hw price marker on onprem line
  var curX = x(Math.min(onprem.hwPrice, hiBound));
  var curV = onpremTCOForPrice(onprem.hwPrice, workload, onprem, months).total;
  var curY = y(Math.min(curV, maxV));
  svg.appendChild(svgEl("circle", { cx: curX, cy: curY, r: 4, fill: "none", stroke: "var(--ink)", "stroke-width": "2" }));

  [0, 0.5, 1].forEach(function(f){
    var v = maxV * f;
    var ty = y(v);
    var t = svgEl("text", { x: padL - 8, y: ty + 3, "text-anchor": "end", class: "axis-label" });
    t.textContent = "$" + Math.round(v).toLocaleString("en-US");
    svg.appendChild(t);
  });
  var xStep = hiBound / 6;
  for(var k = 0; k <= 6; k++){
    var xv = xStep * k;
    var lx = svgEl("text", { x: x(xv), y: H - 6, "text-anchor": "middle", class: "axis-label" });
    lx.textContent = "$" + Math.round(xv);
    svg.appendChild(lx);
  }
}

function drawLifecycleChart(workload, pricing, transitionDay, targetClass, reversalResult){
  var svg = $("lifecycleChart");
  clearSvg(svg);
  var W = 900, H = 240, padL = 56, padR = 14, padT = 16, padB = 26;
  var innerW = W - padL - padR, innerH = H - padT - padB;

  var logLo = 1.80618, logHi = 6; // 64 KB .. 1,000,000 KB, matches main slider
  var days = workload.retentionDays;
  var noTransition = costNoTransition(days, pricing.standard.storage);

  var N = 60;
  var transPts = [];
  var maxV = noTransition;
  for(var i = 0; i <= N; i++){
    var logV = logLo + (logHi - logLo) * i / N;
    var sizeKB = Math.pow(10, logV);
    var c = costTransition(sizeKB, days, transitionDay, pricing.standard, pricing[targetClass]);
    transPts.push([logV, c.total]);
    if(c.total > maxV) maxV = c.total;
  }
  maxV *= 1.08;

  function x(logV){ return padL + innerW * (logV - logLo) / (logHi - logLo); }
  function y(v){ return padT + innerH - (v / maxV) * innerH; }

  var flatPts = [[x(logLo), y(noTransition)], [x(logHi), y(noTransition)]];
  svg.appendChild(svgEl("path", { d: pathFromPoints(flatPts), fill: "none", stroke: "var(--steel)", "stroke-width": "2.4" }));

  var linePts = transPts.map(function(p){ return [x(p[0]), y(p[1])]; });
  svg.appendChild(svgEl("path", { d: pathFromPoints(linePts), fill: "none", stroke: "var(--signal)", "stroke-width": "2.4" }));

  if(reversalResult.size){
    var rx = x(Math.log10(reversalResult.size));
    svg.appendChild(svgEl("line", { x1: rx, y1: padT, x2: rx, y2: H - padB, stroke: "var(--line)", "stroke-width": "1", "stroke-dasharray": "3 3" }));
    svg.appendChild(svgEl("circle", { cx: rx, cy: y(noTransition), r: 5, fill: "var(--ink)" }));
  }

  var curX = x(Math.log10(workload.objSizeKB));
  svg.appendChild(svgEl("circle", { cx: curX, cy: y(costTransition(workload.objSizeKB, days, transitionDay, pricing.standard, pricing[targetClass]).total), r: 4, fill: "none", stroke: "var(--ink)", "stroke-width": "2" }));

  [0, 0.5, 1].forEach(function(f){
    var v = maxV * f;
    var ty = y(v);
    var t = svgEl("text", { x: padL - 8, y: ty + 3, "text-anchor": "end", class: "axis-label" });
    t.textContent = "$" + Math.round(v).toLocaleString("en-US");
    svg.appendChild(t);
  });
  [64, 1000, 10000, 100000, 1000000].forEach(function(kb){
    var lv = Math.log10(kb);
    if(lv < logLo - 0.001 || lv > logHi + 0.001) return;
    var lx = svgEl("text", { x: x(lv), y: H - 6, "text-anchor": "middle", class: "axis-label" });
    lx.textContent = fmtKB(kb);
    svg.appendChild(lx);
  });
}

function drawAttributionChart(attrib){
  var svg = $("attributionChart");
  clearSvg(svg);
  var W = 900, H = 70, padL = 4, padR = 4, padT = 14, padB = 14;
  var barY = padT, barH = H - padT - padB;
  var innerW = W - padL - padR;
  var total = attrib.totalBill || 1;

  var colors = {
    cold: "var(--signal)",
    snap: "var(--signal-deep)",
    egress: "var(--steel)",
    small: "var(--steel-soft)",
    over: "var(--ok)"
  };

  var defs = svgEl("defs", {});
  var pattern = svgEl("pattern", { id: "unattrHatch", width: 6, height: 6, patternTransform: "rotate(45)", patternUnits: "userSpaceOnUse" });
  pattern.appendChild(svgEl("rect", { width: 6, height: 6, fill: "color-mix(in srgb, var(--ink-faint) 22%, transparent)" }));
  pattern.appendChild(svgEl("line", { x1: 0, y1: 0, x2: 0, y2: 6, stroke: "var(--ink-faint)", "stroke-width": 2 }));
  defs.appendChild(pattern);
  svg.appendChild(defs);

  var cursor = padL;
  attrib.categories.forEach(function(cat){
    var w = (cat.cost / total) * innerW;
    if(w > 0.2){
      svg.appendChild(svgEl("rect", { x: cursor, y: barY, width: w, height: barH, fill: colors[cat.key] }));
    }
    cursor += w;
  });
  var unattrW = Math.max(0, innerW - (cursor - padL));
  if(unattrW > 0.2){
    svg.appendChild(svgEl("rect", { x: cursor, y: barY, width: unattrW, height: barH, fill: "url(#unattrHatch)" }));
  }
  svg.appendChild(svgEl("rect", { x: padL, y: barY, width: innerW, height: barH, fill: "none", stroke: "var(--line)", "stroke-width": 1 }));
}

// ---------------------------------------------------------------------
// preset data
// ---------------------------------------------------------------------
var PRESETS = {
  small: { totalTB: 150, objSizeKB: 64, growth: 3, retention: 90, readRatio: 8, egress: 2 },
  media: { totalTB: 800, objSizeKB: 500000, growth: 5, retention: 730, readRatio: 10, egress: 40 },
  medimg: { totalTB: 1200, objSizeKB: 150000, growth: 8, retention: 1825, readRatio: 1, egress: 10 },
  log: { totalTB: 400, objSizeKB: 2000, growth: 4, retention: 180, readRatio: 2, egress: 8 }
};

function applyPreset(key){
  var p = PRESETS[key];
  if(!p) return;
  $("totalTB").value = p.totalTB;
  $("objSize").value = Math.log10(p.objSizeKB);
  $("growth").value = p.growth;
  $("retention").value = p.retention;
  $("readRatio").value = p.readRatio;
  $("egress").value = p.egress;
  renderAll();
}

// ---------------------------------------------------------------------
// render orchestration
// ---------------------------------------------------------------------
function renderAll(){
  var workload = readWorkload();
  var pricing = readCloudPricing();
  var onprem = readOnprem();
  var months = onprem.years * 12;

  // ---- slider value labels ----
  $("totalTBVal").textContent = workload.totalTB.toLocaleString("en-US") + " TB";
  $("objSizeVal").textContent = fmtKB(workload.objSizeKB);
  $("growthVal").textContent = workload.growthPct.toFixed(1) + "%";
  $("retentionVal").textContent = workload.retentionDays.toLocaleString("en-US") + "일";
  $("readRatioVal").textContent = workload.readRatioPct.toFixed(1) + "%";
  $("egressVal").textContent = workload.egressTB.toFixed(1) + " TB";
  $("hwPriceVal").textContent = "$" + onprem.hwPrice.toFixed(0) + "/TB";

  // ---- cloud + onprem TCO ----
  var cloud = computeCloudMonthlySeries(workload, pricing, months);
  var onpremCum = computeOnpremCumulative(onprem.hwPrice, workload, onprem, months);
  var breakeven = bisectBreakeven(cloud.total, workload, onprem, months);

  $("mCloudTCO").textContent = fmtUSD0(cloud.total);
  $("mOnpremTCO").textContent = fmtUSD0(onpremCum.total);
  var deltaEl = $("mOnpremDelta");
  var delta = onpremCum.total - cloud.total;
  deltaEl.className = "metric__delta " + (delta < 0 ? "good" : "bad");
  deltaEl.textContent = (delta <= 0 ? "클라우드보다 " : "클라우드보다 ") + fmtUSD0(Math.abs(delta)) + (delta <= 0 ? " 저렴" : " 비쌈");

  var beNote = $("mBreakevenNote");
  var verdictSide = $("mVerdictSide");
  if(breakeven.price !== null){
    $("mBreakeven").textContent = fmtUSD1(breakeven.price) + "/TB";
    var ratioToBaseline = onprem.hwPrice > 0 ? breakeven.price / onprem.hwPrice : NaN;
    beNote.textContent = "현재 입력값의 " + fmtRatio(ratioToBaseline);
    var cheaper = onprem.hwPrice < breakeven.price ? "온프렘" : "클라우드";
    verdictSide.textContent = cheaper + " 유리";
  } else if(breakeven.always === "cloud"){
    $("mBreakeven").textContent = "없음";
    beNote.textContent = "고정 운영비만으로 이미 클라우드 초과";
    verdictSide.textContent = "클라우드 항상 유리";
  } else {
    $("mBreakeven").textContent = "없음";
    beNote.textContent = "이 구간에서 항상 온프렘 저렴";
    verdictSide.textContent = "온프렘 항상 유리";
  }

  var verdictText = $("verdictText");
  if(breakeven.price !== null){
    verdictText.innerHTML = "이 워크로드는 원시 TB당 <strong>" + fmtUSD1(breakeven.price) + "</strong> 아래에서는 온프렘이, 그 위에서는 클라우드가 " + onprem.years + "년 기준 총액에서 유리합니다. 현재 입력한 단가($" + onprem.hwPrice.toFixed(0) + "/TB)에서는 " + verdictSide.textContent.replace(" 유리","") + "이 " + fmtUSD0(Math.abs(delta)) + " 더 쌉니다.";
  } else if(breakeven.always === "cloud"){
    verdictText.innerHTML = "현재 조합에서는 하드웨어 단가를 아무리 낮춰도 <strong>클라우드가 항상 유리</strong>합니다. 고정 운영비(전력·상면·인건비)만으로 이미 클라우드 " + onprem.years + "년 총비용을 넘어서기 때문입니다.";
  } else {
    verdictText.innerHTML = "현재 조합에서는 하드웨어 단가가 매우 높아도 <strong>온프렘이 항상 유리</strong>합니다. 데이터 증가율이 커서 클라우드 누적 비용이 그만큼 빠르게 불어나기 때문입니다.";
  }

  drawCumulativeChart(cloud.series, onpremCum.series, months);
  drawBreakevenChart(cloud.total, workload, onprem, months, breakeven);

  // ---- lifecycle simulation ----
  var transitionDay = parseInt($("transitionDay").value, 10);
  $("transitionDayVal").textContent = transitionDay + "일";
  var targetClass = $("targetClass").value;
  var life = computeLifecycle(workload, pricing, transitionDay, targetClass);
  var reversal = bisectReversalSize(workload, pricing, transitionDay, targetClass);

  $("mNoTransition").textContent = fmtUSD1(life.noTransition) + "/TB";
  $("mTransition").textContent = fmtUSD1(life.transition) + "/TB";
  $("mRatio").textContent = fmtRatio(life.ratio);
  var ratioNote = $("mRatioNote");
  ratioNote.className = "metric__delta " + (life.ratio < 1 ? "good" : "bad");
  ratioNote.textContent = life.ratio < 1 ? "전환이 유리" : "전환이 불리";

  if(reversal.size){
    $("mReversalSize").textContent = fmtKB(reversal.size);
  } else if(reversal.always === "better"){
    $("mReversalSize").textContent = "전 구간 유리";
  } else {
    $("mReversalSize").textContent = "전 구간 불리";
  }

  var lifeSentence = $("lifecycleSentence");
  if(life.ratio < 1){
    lifeSentence.innerHTML = "현재 설정(객체 " + fmtKB(workload.objSizeKB) + " · 보존 " + workload.retentionDays + "일 · " + transitionDay + "일차 전환)에서는 라이프사이클 전환이 아무것도 하지 않는 것보다 <strong>" + fmtPct1((1 - life.ratio) * 100) + " 저렴</strong>합니다.";
  } else {
    lifeSentence.innerHTML = "현재 설정(객체 " + fmtKB(workload.objSizeKB) + " · 보존 " + workload.retentionDays + "일 · " + transitionDay + "일차 전환)에서는 라이프사이클 전환이 아무것도 하지 않는 것보다 <strong>" + fmtRatio(life.ratio) + " 더 비쌉니다</strong>. 전환 요청비와 최소 보관 기간 위약금이 저장비 절감분을 넘어섰기 때문입니다.";
  }

  drawLifecycleChart(workload, pricing, transitionDay, targetClass, reversal);

  // ---- bill attribution ----
  var attribParams = {
    coldPct: parseFloat($("coldPct").value),
    snapshotPct: parseFloat($("snapshotPct").value),
    overProvPct: parseFloat($("overProvPct").value)
  };
  $("coldPctVal").textContent = attribParams.coldPct + "%";
  $("snapshotPctVal").textContent = attribParams.snapshotPct + "%";
  $("overProvPctVal").textContent = attribParams.overProvPct + "%";

  var cloudMonth0 = cloud.series[0];
  var attrib = computeAttribution(workload, pricing, attribParams, cloudMonth0);

  $("legCold").textContent = fmtUSD0(attrib.categories[0].cost) + " (" + fmtPct1(attrib.totalBill > 0 ? attrib.categories[0].cost / attrib.totalBill * 100 : 0) + ")";
  $("legSnap").textContent = fmtUSD0(attrib.categories[1].cost) + " (" + fmtPct1(attrib.totalBill > 0 ? attrib.categories[1].cost / attrib.totalBill * 100 : 0) + ")";
  $("legEgress").textContent = fmtUSD0(attrib.categories[2].cost) + " (" + fmtPct1(attrib.totalBill > 0 ? attrib.categories[2].cost / attrib.totalBill * 100 : 0) + ")";
  $("legSmall").textContent = fmtUSD0(attrib.categories[3].cost) + " (" + fmtPct1(attrib.totalBill > 0 ? attrib.categories[3].cost / attrib.totalBill * 100 : 0) + ")";
  $("legOver").textContent = fmtUSD0(attrib.categories[4].cost) + " (" + fmtPct1(attrib.totalBill > 0 ? attrib.categories[4].cost / attrib.totalBill * 100 : 0) + ")";
  $("legUnattr").textContent = fmtUSD0(attrib.unattributed) + " (" + fmtPct1(100 - attrib.attributionRate) + ")";

  $("mAttributed").textContent = fmtUSD0(attrib.attributed);
  $("mUnattributed").textContent = fmtUSD0(attrib.unattributed);
  $("mAttribRate").textContent = fmtPct1(attrib.attributionRate);

  drawAttributionChart(attrib);

  var validationOk = !attrib.overflow && !attrib.percentSumOver100 && (attrib.attributed + attrib.unattributed) <= attrib.totalBill + 0.01;
  var dot = $("validationDot");
  var vtext = $("validationText");
  dot.className = "validation-dot " + (validationOk ? "ok" : "bad");
  if(validationOk){
    vtext.textContent = "검증 통과: 원인별 합계가 총 청구액을 넘지 않고, 카테고리 간 중복 계상이 없습니다.";
  } else if(attrib.percentSumOver100){
    vtext.textContent = "검증 실패: 콜드·스냅샷·과잉 프로비저닝 비율의 합이 100%를 넘습니다. 값을 낮춰주세요.";
  } else {
    vtext.textContent = "검증 실패: 원인별 합계가 총 청구액을 넘어 특정액을 총액으로 잘랐습니다. 입력값을 확인하세요.";
  }

  var trapBox = $("lifecycleTrapWarning");
  if(life.ratio > 1){
    trapBox.hidden = false;
    $("trapWarningText").textContent = "현재 라이프사이클 설정(객체 " + fmtKB(workload.objSizeKB) + " · 보존 " + workload.retentionDays + "일 · " + transitionDay + "일차 전환)은 아무것도 하지 않는 것보다 " + fmtRatio(life.ratio) + " 비쌉니다. 이 항목은 절감 후보가 아니라 손실 항목이므로 청구서 원인 분해의 절감 가능액에 넣지 마세요.";
  } else {
    trapBox.hidden = true;
  }

  // ---- final combined verdict ----
  var finalVerdict = $("finalVerdict");
  var beText = breakeven.price !== null
    ? "TB당 " + fmtUSD1(breakeven.price) + " 아래에서는 온프렘이, 그 위에서는 클라우드가"
    : (breakeven.always === "cloud" ? "하드웨어 단가와 무관하게 클라우드가" : "하드웨어 단가와 무관하게 온프렘이");
  finalVerdict.innerHTML = "이 워크로드는 " + beText + " " + onprem.years + "년 기준 총액에서 " + fmtUSD0(Math.abs(delta)) + " 유리합니다. 청구서 원인 중 절감 가능액으로 특정된 몫은 <strong>" + fmtPct1(attrib.attributionRate) + "</strong>이고, 나머지 " + fmtPct1(100 - attrib.attributionRate) + "는 미귀속입니다.";
}

// ---------------------------------------------------------------------
// wiring
// ---------------------------------------------------------------------
function wireInputs(){
  var rangeIds = ["totalTB", "objSize", "growth", "retention", "readRatio", "egress",
    "hwPrice", "transitionDay", "coldPct", "snapshotPct", "overProvPct"];
  rangeIds.forEach(function(id){
    $(id).addEventListener("input", renderAll);
  });

  var numberIds = ["replacementRate", "monthlyOpex", "egressPrice"];
  CLASSES.forEach(function(c){
    numberIds.push("price_storage_" + c, "price_put_" + c, "price_get_" + c, "price_min_" + c);
    if(c !== "standard") numberIds.push("price_transfee_" + c);
  });
  numberIds.forEach(function(id){
    var el = $(id);
    if(el) el.addEventListener("input", renderAll);
  });

  $("ecScheme").addEventListener("change", renderAll);
  $("targetClass").addEventListener("change", renderAll);

  document.querySelectorAll(".year-btn").forEach(function(btn){
    btn.addEventListener("click", function(){
      document.querySelectorAll(".year-btn").forEach(function(b){ b.setAttribute("aria-pressed", "false"); });
      btn.setAttribute("aria-pressed", "true");
      renderAll();
    });
  });

  document.querySelectorAll(".preset-btn").forEach(function(btn){
    btn.addEventListener("click", function(){ applyPreset(btn.dataset.preset); });
  });

  var honestyCheck = $("honestyCheck");
  var reportBtn = $("reportBtn");
  var reportStatus = $("reportStatus");
  honestyCheck.addEventListener("change", function(){
    reportBtn.disabled = !honestyCheck.checked;
    reportStatus.textContent = honestyCheck.checked
      ? "요금을 확인했다는 전제로 보고서 생성이 가능한 상태입니다."
      : "체크박스를 확인하기 전에는 보고서를 생성할 수 없습니다. 미확인 요금 표시를 지운 채로 고객에게 나가는 숫자를 막기 위한 게이트입니다.";
  });
  reportBtn.addEventListener("click", function(){
    if(reportBtn.disabled) return;
    reportStatus.textContent = "이 데모는 보고서 파일을 만들지 않습니다. 이 버튼은 미확인 요금 게이트가 실제로 상태를 막는다는 것만 보여줍니다. 실제 보고서는 확인된 요금으로 상담 시 생성합니다.";
  });
}

wireInputs();
renderAll();

})();
