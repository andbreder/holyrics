(function () {
  "use strict";

  const DEFAULT_CONFIG = {
    servers: ["http://localhost:7575"],
    requestPath: "/stage-view/text.json",
    intervalMs: 400,
    timeoutMs: 3000,
    debug: false,
  };

  const appState = {
    serverIndex: 0,
    currentKey: "",
    currentData: null,
    intervalId: 0,
    isChecking: false,
    isTransitioning: false,
    pendingState: null,
    transitionTargetKey: "",
  };

  function getConfig() {
    return Object.assign({}, DEFAULT_CONFIG, window.HolyricsConfig || {});
  }

  function log() {
    if (getConfig().debug) {
      console.log.apply(console, arguments);
    }
  }

  function getTargetType() {
    return String(document.body.dataset.holyricsType || "").toUpperCase();
  }

  function getEndpointUrl() {
    const config = getConfig();
    const servers = config.servers.length ? config.servers : DEFAULT_CONFIG.servers;
    const server = servers[appState.serverIndex] || servers[0];
    const path = config.requestPath.startsWith("/") ? config.requestPath : `/${config.requestPath}`;

    return `${server.replace(/\/$/, "")}${path}`;
  }

  function nextServer() {
    const servers = getConfig().servers;
    appState.serverIndex = (appState.serverIndex + 1) % Math.max(servers.length, 1);
  }

  function getAnimationDurationMs() {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue("--motion-duration")
      .trim();
    const amount = Number.parseFloat(value) || 300;

    if (value.endsWith("ms")) {
      return amount;
    }

    return value.endsWith("s") ? amount * 1000 : amount;
  }

  function stableStringify(value) {
    if (value === null || typeof value !== "object") {
      return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
      return `[${value.map(stableStringify).join(",")}]`;
    }

    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }

  function parseHtmlFragment(html) {
    const template = document.createElement("template");
    template.innerHTML = String(html || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/span>\s*<span/gi, "</span>\n<span");

    template.content
      .querySelectorAll("[style*='display:none'], [style*='visibility:hidden'], #text-force-update_0")
      .forEach((node) => node.remove());

    return template;
  }

  function extractLines(html) {
    const source = String(html || "");
    const hasTags = /<\/?[a-z][\s\S]*>/i.test(source);
    const text = hasTags ? parseHtmlFragment(source).content.textContent : source;

    return text
      .split(/\r?\n/)
      .map((line) => line.replace(/\u00a0/g, " ").trim())
      .filter(Boolean);
  }

  function extractText(html) {
    return extractLines(html).join("\n");
  }

  function textFromHtml(html) {
    return parseHtmlFragment(html).content.textContent.replace(/\u00a0/g, " ").trim();
  }

  function isEmptyMap(map) {
    if (!map || typeof map !== "object") {
      return true;
    }

    const type = String(map.type || "").trim().toUpperCase();
    return !type || type === "EMPTY";
  }

  function getMap(response) {
    if (!response || response.reload === "_true") {
      return null;
    }

    return isEmptyMap(response.map) ? null : response.map;
  }

  function getAnimationOptions(renderer, currentData, nextData, reason) {
    const fallback = {
      enterClass: "animate__fadeIn",
      exitClass: "animate__fadeOut",
    };

    if (renderer && typeof renderer.animation === "function") {
      return Object.assign(fallback, renderer.animation(currentData, nextData, reason) || {});
    }

    return Object.assign(fallback, renderer && renderer.animation ? renderer.animation : {});
  }

  function waitForMotion() {
    return new Promise((resolve) => {
      window.setTimeout(resolve, getAnimationDurationMs());
    });
  }

  async function animateOut(node, exitClass) {
    node.className = node.className
      .split(/\s+/)
      .filter((className) => className && !className.startsWith("animate__"))
      .join(" ");
    node.classList.add("animate__animated", exitClass);
    await waitForMotion();
  }

  function animateIn(node, enterClass) {
    node.classList.add("animate__animated", enterClass);
  }

  function clearStage(options) {
    queueStage(null, "", null, options && options.reason ? options.reason : "clear");
  }

  function queueStage(nextData, nextKey, renderer, reason) {
    const activeKey = appState.isTransitioning ? appState.transitionTargetKey : appState.currentKey;

    if (nextKey === activeKey) {
      return;
    }

    if (!nextKey && !activeKey && !appState.isTransitioning) {
      document.body.classList.add("is-empty");
      return;
    }

    appState.pendingState = {
      nextData,
      nextKey,
      renderer,
      reason,
    };

    if (!appState.isTransitioning) {
      flushPendingState();
    }
  }

  async function flushPendingState() {
    if (!appState.pendingState) {
      return;
    }

    while (appState.pendingState) {
      const state = appState.pendingState;
      appState.pendingState = null;
      appState.isTransitioning = true;
      appState.transitionTargetKey = state.nextKey;

      try {
        await transitionStage(state);
      } catch (error) {
        log("[holyrics transition]", error);
      } finally {
        appState.isTransitioning = false;
        appState.transitionTargetKey = "";
      }

      // loop will continue if a new pendingState arrived during transition
    }
  }

  async function transitionStage(state) {
    const stage = document.querySelector("[data-stage]");
    if (!stage) {
      return;
    }

    const current = stage.firstElementChild;
    const options = getAnimationOptions(
      state.renderer,
      appState.currentData,
      state.nextData,
      state.reason
    );

    if (current) {
      await animateOut(current, options.exitClass);
      if (current.parentElement === stage) {
        current.remove();
      }
    }

    appState.currentKey = "";
    appState.currentData = null;

    if (appState.pendingState && appState.pendingState.nextKey !== state.nextKey) {
      return;
    }

    if (!state.nextData) {
      document.body.classList.add("is-empty");
      return;
    }

    const nextNode = state.renderer.render(state.nextData);
    stage.appendChild(nextNode);
    document.body.classList.remove("is-empty");

    appState.currentKey = state.nextKey;
    appState.currentData = state.nextData;
    animateIn(nextNode, options.enterClass);
  }

  async function fetchJson() {
    const controller = new AbortController();
    const config = getConfig();
    const timeoutId = window.setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      const response = await fetch(getEndpointUrl(), {
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async function checkCurrentState() {
    if (appState.isChecking) {
      return;
    }

    appState.isChecking = true;
    try {
      const response = await fetchJson();
      const map = getMap(response);
      const targetType = getTargetType();
      const currentType = map ? String(map.type || "").toUpperCase() : "";

      if (!map || currentType !== targetType) {
        clearStage({ reason: "type-change" });
        return;
      }

      const renderer = window.HolyricsRenderer;
      if (!renderer || typeof renderer.normalize !== "function" || typeof renderer.render !== "function") {
        throw new Error("Renderer nao configurado para esta pagina.");
      }

      const normalized = renderer.normalize(map);
      const key = stableStringify(normalized);
      if (key !== appState.currentKey) {
        queueStage(normalized, key, renderer, appState.currentKey ? "replace" : "enter");
      }
    } catch (error) {
      log("[holyrics]", error);
      nextServer();
      clearStage({ reason: "type-change" });
    } finally {
      appState.isChecking = false;
    }
  }

  function startLoop() {
    const config = getConfig();
    window.clearInterval(appState.intervalId);
    checkCurrentState();
    appState.intervalId = window.setInterval(checkCurrentState, config.intervalMs);
  }

  window.Holyrics = {
    clearStage,
    extractLines,
    extractText,
    getAnimationDurationMs,
    parseHtmlFragment,
    queueStage,
    textFromHtml,
  };

  document.addEventListener("DOMContentLoaded", startLoop);
})();
