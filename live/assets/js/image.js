(function () {
  "use strict";

  function getMimeType(format) {
    const normalized = String(format || "jpg").toLowerCase().replace(".", "");

    if (normalized === "jpg" || normalized === "jpeg") {
      return "image/jpeg";
    }

    if (normalized === "png") {
      return "image/png";
    }

    if (normalized === "webp") {
      return "image/webp";
    }

    return `image/${normalized}`;
  }

  function extractBase64(value) {
    const raw = String(value || "").trim();
    if (raw.startsWith("data:")) {
      return raw;
    }

    const match = raw.match(/^[A-Za-z0-9+/=]+/);
    return match ? match[0] : "";
  }

  function extractAlt(value) {
    const raw = String(value || "");
    const match = raw.match(/\balt=['"]([^'"]+)['"]/i);
    return match ? match[1] : "Holyrics image";
  }

  window.HolyricsRenderer = {
    animation() {
      return {
        enterClass: "animate__fadeIn",
        exitClass: "animate__fadeOut",
      };
    },

    normalize(map) {
      const src = extractBase64(map.img64);
      const mime = getMimeType(map.img_format);

      return {
        src: src.startsWith("data:") ? src : `data:${mime};base64,${src}`,
        alt: extractAlt(map.img64),
        background: map.background || "#000000",
      };
    },

    render(data) {
      const wrapper = document.createElement("section");
      wrapper.className = "image";
      wrapper.style.background = data.background;

      const image = document.createElement("img");
      image.src = data.src;
      image.alt = data.alt;
      image.decoding = "async";

      wrapper.appendChild(image);
      return wrapper;
    },
  };
})();
