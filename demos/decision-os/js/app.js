(function () {
  "use strict";

  var tabBtns = Array.prototype.slice.call(document.querySelectorAll(".tab-btn"));
  var panels = Array.prototype.slice.call(document.querySelectorAll(".tabpanel"));
  var initialized = {};

  // per-tab boot functions are registered by each tab-*.js file onto
  // window.DECISION_OS_TABS = { nurse: fn, solver: fn, ... }. app.js just
  // owns switching + lazy first-activation.
  var TABS = (window.DECISION_OS_TABS = window.DECISION_OS_TABS || {});

  function activate(name) {
    tabBtns.forEach(function (btn) {
      var isActive = btn.getAttribute("data-tab") === name;
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
      btn.tabIndex = isActive ? 0 : -1;
    });
    panels.forEach(function (panel) {
      var isActive = panel.getAttribute("data-panel") === name;
      panel.classList.toggle("is-active", isActive);
      if (isActive) {
        panel.removeAttribute("hidden");
      } else {
        panel.setAttribute("hidden", "");
      }
    });
    if (!initialized[name] && typeof TABS[name] === "function") {
      initialized[name] = true;
      TABS[name]();
    }
  }

  tabBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      activate(btn.getAttribute("data-tab"));
    });
  });

  // basic left/right arrow key support (WAI-ARIA tabs pattern)
  var tabbar = document.querySelector(".tabbar");
  if (tabbar) {
    tabbar.addEventListener("keydown", function (evt) {
      var idx = tabBtns.findIndex(function (b) { return b.getAttribute("aria-selected") === "true"; });
      if (idx === -1) return;
      var next = null;
      if (evt.key === "ArrowRight") next = (idx + 1) % tabBtns.length;
      else if (evt.key === "ArrowLeft") next = (idx - 1 + tabBtns.length) % tabBtns.length;
      if (next !== null) {
        evt.preventDefault();
        tabBtns[next].focus();
        activate(tabBtns[next].getAttribute("data-tab"));
      }
    });
  }

  // boot the first (already-visible) tab immediately
  activate("nurse");
})();
