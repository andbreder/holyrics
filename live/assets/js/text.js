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

  function fitTextLines(element) {
    if (window.Holyrics && typeof window.Holyrics.fitTextToBox === "function") {
      window.Holyrics.fitTextToBox(element, { minFontSize: 10 });
    }
  }

  function waitForMotion() {
    return new Promise((resolve) => {
      window.setTimeout(resolve, window.Holyrics.getAnimationDurationMs());
    });
  }

  function resetAnimation(element) {
    element.className = element.className
      .split(/\s+/)
      .filter((className) => className && !className.startsWith("animate__"))
      .join(" ");
  }

  function animate(element, animationClass) {
    resetAnimation(element);
    element.classList.add("animate__animated", animationClass);
  }

  function createTitle(data) {
    if (!data.title) {
      return null;
    }

    const title = document.createElement("h1");
    title.className = "text-title";
    title.textContent = data.title;
    return title;
  }

  function createContent(data) {
    const content = document.createElement("p");
    content.className = "text-lines";
    data.lines.forEach((line) => content.appendChild(createLine(line)));
    fitTextLines(content);
    return content;
  }

  async function replaceElement(currentElement, nextElement, exitClass, enterClass) {
    currentElement.insertAdjacentElement("afterend", nextElement);
    animate(currentElement, exitClass);
    animate(nextElement, enterClass);
    await waitForMotion();

    if (currentElement.parentElement) {
      currentElement.remove();
    }
  }

  async function replaceTitle(currentNode, nextData) {
    const currentTitle = currentNode.querySelector(".text-title");
    const currentContent = currentNode.querySelector(".text-lines");
    const nextTitle = createTitle(nextData);

    if (currentTitle && nextTitle) {
      await replaceElement(currentTitle, nextTitle, "animate__fadeOut", "animate__fadeIn");
      return;
    }

    if (currentTitle && !nextTitle) {
      animate(currentTitle, "animate__fadeOut");
      await waitForMotion();
      currentTitle.remove();
      return;
    }

    if (!currentTitle && nextTitle) {
      currentNode.insertBefore(nextTitle, currentContent);
      animate(nextTitle, "animate__fadeIn");
      await waitForMotion();
    }
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

      const title = createTitle(data);
      if (title) {
        wrapper.appendChild(title);
      }

      wrapper.appendChild(createContent(data));
      return wrapper;
    },

    async transition({ currentNode, currentData, nextData }) {
      if (currentData.isTimer || nextData.isTimer) {
        return false;
      }

      const tasks = [];
      const titleChanged = currentData.title !== nextData.title;
      const linesChanged = currentData.lines.join("\n") !== nextData.lines.join("\n");
      const currentContent = currentNode.querySelector(".text-lines");

      resetAnimation(currentNode);
      currentNode.style.setProperty("--overlay-text-color", nextData.color);

      if (titleChanged) {
        tasks.push(replaceTitle(currentNode, nextData));
      }

      if (titleChanged || linesChanged) {
        tasks.push(
          replaceElement(currentContent, createContent(nextData), "animate__fadeOut", "animate__fadeIn")
        );
      }

      if (tasks.length) {
        await Promise.all(tasks);
      }

      return true;
    },
  };
})();
