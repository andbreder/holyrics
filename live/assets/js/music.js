(function () {
  "use strict";

  const DEFAULT_MUSIC_CONFIG = {
    ignoreComments: true,
    showNextContent: true,
  };

  function getMusicConfig() {
    return Object.assign({}, DEFAULT_MUSIC_CONFIG, window.HolyricsMusicConfig || {});
  }

  function createLine(lineData) {
    const line = document.createElement("span");
    line.textContent = typeof lineData === "string" ? lineData : lineData.text;

    if (lineData && typeof lineData === "object" && lineData.isComment) {
      line.classList.add("comment");
    }

    return line;
  }

  function appendTextWithPlusMarks(element, text) {
    String(text || "")
      .split(/(\+)/)
      .forEach((part) => {
        if (!part) {
          return;
        }

        if (part === "+") {
          const mark = document.createElement("span");
          mark.className = "music-plus";
          mark.textContent = part;
          element.appendChild(mark);
          return;
        }

        element.appendChild(document.createTextNode(part));
      });
  }

  function normalizeLineText(text) {
    return String(text || "").replace(/\u00a0/g, " ").trim();
  }

  function pushLine(lines, text, isComment, followsSeparator) {
    const value = normalizeLineText(text);

    if (value) {
      lines.push({
        text: value,
        isComment: Boolean(isComment),
        followsSeparator: Boolean(followsSeparator),
      });
      return true;
    }

    return false;
  }

  function isContinuationLine(line) {
    return /^\.\.\./.test(line.text);
  }

  function isEndLine(line) {
    return /^\[FIM\]$/i.test(line.text);
  }

  function prepareDisplayLines(lines, options) {
    let displayLines = lines.filter((line) => !isEndLine(line));

    if (options.ignoreComments) {
      displayLines = displayLines.filter((line) => !line.isComment);
    }

    const continuationIndex = displayLines.findIndex(isContinuationLine);

    if (continuationIndex === -1) {
      return displayLines;
    }

    if (options.showNextContent && displayLines.length === 1) {
      return displayLines;
    }

    return displayLines.slice(0, continuationIndex);
  }

  function createPlainMusicLines(source) {
    let followsSeparator = false;

    return String(source || "")
      .split(/\r?\n/)
      .reduce((lines, text) => {
        if (pushLine(lines, text, false, followsSeparator)) {
          followsSeparator = false;
        } else if (lines.length) {
          followsSeparator = true;
        }

        return lines;
      }, []);
  }

  function extractMusicLines(html) {
    const source = String(html || "");
    const hasTags = /<\/?[a-z][\s\S]*>/i.test(source);

    if (!hasTags) {
      return createPlainMusicLines(source);
    }

    const template = window.Holyrics.parseHtmlFragment(source);
    const lines = [];
    let currentText = "";
    let currentIsComment = false;
    let followsSeparator = false;

    function flushLine() {
      if (pushLine(lines, currentText, currentIsComment, followsSeparator)) {
        followsSeparator = false;
      } else if (lines.length) {
        followsSeparator = true;
      }

      currentText = "";
      currentIsComment = false;
    }

    function appendText(text, isComment) {
      String(text || "")
        .replace(/\u00a0/g, " ")
        .split(/\r?\n/)
        .forEach((part, index) => {
          if (index > 0) {
            flushLine();
          }

          currentText += part;

          if (part.trim() && isComment) {
            currentIsComment = true;
          }
        });
    }

    function walk(node, isComment) {
      if (node.nodeType === Node.TEXT_NODE) {
        appendText(node.nodeValue, isComment);
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
        return;
      }

      const nodeIsComment =
        isComment || (node.classList && node.classList.contains("comment"));

      node.childNodes.forEach((child) => walk(child, nodeIsComment));
    }

    walk(template.content, false);
    flushLine();

    return lines.length ? lines : createPlainMusicLines(source);
  }

  window.HolyricsRenderer = {
    animation(currentData, nextData, reason) {
      if (reason === "replace") {
        return {
          enterClass: "animate__fadeInUp",
          exitClass: "animate__fadeOutDown",
        };
      }

      return {
        enterClass: "animate__fadeInUp",
        exitClass: "animate__fadeOut",
      };
    },

    normalize(map) {
      const title = String(map.$system_var_music_title || "").trim();
      const author = String(map.$system_var_music_author || "").trim();
      const artist = String(map.$system_var_music_artist || author).trim();
      const rawText = String(map.text || "");
      const lines = prepareDisplayLines(extractMusicLines(rawText), getMusicConfig());
      const isTitle = map.custom_class === "music_title";
      const isPreview = lines.length === 1 && isContinuationLine(lines[0]);

      if (!isTitle && !lines.length) {
        return null;
      }

      return {
        isTitle,
        isPreview,
        rawText,
        title,
        artist,
        lines,
        color: map.color || "#FAFAFA",
        background: map.background || "#000000",
      };
    },

    render(data) {
      const wrapper = document.createElement("section");
      wrapper.className = data.isTitle ? "music music-title" : "music music-verse";

      if (data.isPreview) {
        wrapper.classList.add("music-preview");
        wrapper.style.setProperty("--overlay-text-color", "#b8b8b8");
        wrapper.style.setProperty("--overlay-stroke-color", "#5f5f5f");
      } else {
        wrapper.style.setProperty("--overlay-text-color", data.color);
      }

      if (data.isTitle) {
        const name = document.createElement("h1");
        name.className = "music-name";
        appendTextWithPlusMarks(name, data.title || (data.lines[0] ? data.lines[0].text : ""));

        const artist = document.createElement("p");
        artist.className = "music-artist";
        appendTextWithPlusMarks(artist, data.artist);

        wrapper.append(name, artist);
        return wrapper;
      }

      const verse = document.createElement("p");
      verse.className = "music-lines";
      data.lines.forEach((line) => verse.appendChild(createLine(line)));
      wrapper.appendChild(verse);

      return wrapper;
    },
  };
})();
