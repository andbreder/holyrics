(function () {
  "use strict";

  function formatToday() {
    const today = new Date();
    return [
      String(today.getDate()).padStart(2, "0"),
      String(today.getMonth() + 1).padStart(2, "0"),
      today.getFullYear(),
    ].join("/");
  }

  function createLine(text) {
    const line = document.createElement("span");
    line.textContent = text;
    return line;
  }

  window.HolyricsRenderer = {
    animation() {
      return {
        enterClass: "animate__fadeIn",
        exitClass: "animate__fadeOut",
      };
    },

    normalize(map) {
      const lines = window.Holyrics.extractLines(map.text);
      const timerMatch = lines.length === 1 ? lines[0].match(/^(\d{1,3}):(\d{1,2})$/) : null;

      return {
        title: String(map.$system_var_text_title || "").trim(),
        lines,
        isTimer: Boolean(timerMatch),
        timer: timerMatch
          ? `${timerMatch[1].padStart(2, "0")}:${timerMatch[2].padStart(2, "0")}`
          : "",
        color: map.color || "#FAFAFA",
      };
    },

    render(data) {
      const wrapper = document.createElement("section");
      wrapper.className = data.isTimer ? "text timer" : "text text-message";
      wrapper.style.setProperty("--overlay-text-color", data.color);

      if (data.isTimer) {
        const time = document.createElement("p");
        time.className = "timer-value";
        time.textContent = data.timer;

        const date = document.createElement("span");
        date.className = "timer-date";
        date.textContent = formatToday();

        wrapper.append(time, date);
        return wrapper;
      }

      if (data.title) {
        const title = document.createElement("h1");
        title.className = "text-title";
        title.textContent = data.title;
        wrapper.appendChild(title);
      }

      const content = document.createElement("p");
      content.className = "text-lines";
      data.lines.forEach((line) => content.appendChild(createLine(line)));
      wrapper.appendChild(content);

      return wrapper;
    },
  };
})();
