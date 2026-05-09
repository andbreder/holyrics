(function () {
  "use strict";

  function createLine(text) {
    const line = document.createElement("span");
    line.textContent = text;
    return line;
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
      const lines = window.Holyrics.extractLines(map.text);
      const isTitle = map.custom_class === "music_title";

      return {
        isTitle,
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
      wrapper.style.setProperty("--overlay-text-color", data.color);

      if (data.isTitle) {
        const name = document.createElement("h1");
        name.className = "music-name";
        name.textContent = data.title || data.lines[0] || "";

        const artist = document.createElement("p");
        artist.className = "music-artist";
        artist.textContent = data.artist;

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
