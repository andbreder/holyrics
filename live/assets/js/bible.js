(function () {
  "use strict";

  const BOOK_ORDER = [
    "Genesis",
    "Exodo",
    "Levitico",
    "Numeros",
    "Deuteronomio",
    "Josue",
    "Juizes",
    "Rute",
    "1 Samuel",
    "2 Samuel",
    "1 Reis",
    "2 Reis",
    "1 Cronicas",
    "2 Cronicas",
    "Esdras",
    "Neemias",
    "Ester",
    "Jo",
    "Salmos",
    "Proverbios",
    "Eclesiastes",
    "Cantares",
    "Isaias",
    "Jeremias",
    "Lamentacoes",
    "Ezequiel",
    "Daniel",
    "Oseias",
    "Joel",
    "Amos",
    "Obadias",
    "Jonas",
    "Miqueias",
    "Naum",
    "Habacuque",
    "Sofonias",
    "Ageu",
    "Zacarias",
    "Malaquias",
    "Mateus",
    "Marcos",
    "Lucas",
    "Joao",
    "Atos",
    "Romanos",
    "1 Corintios",
    "2 Corintios",
    "Galatas",
    "Efesios",
    "Filipenses",
    "Colossenses",
    "1 Tessalonicenses",
    "2 Tessalonicenses",
    "1 Timoteo",
    "2 Timoteo",
    "Tito",
    "Filemon",
    "Hebreus",
    "Tiago",
    "1 Pedro",
    "2 Pedro",
    "1 Joao",
    "2 Joao",
    "3 Joao",
    "Judas",
    "Apocalipse",
  ];

  function stripAccents(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function parseReference(header) {
    const match = String(header || "").match(/^(.*)\s+(\d+):(\d+)$/);
    if (!match) {
      return null;
    }

    return {
      book: match[1],
      chapter: Number.parseInt(match[2], 10),
      verse: Number.parseInt(match[3], 10),
    };
  }

  function directionFor(currentReference, nextReference) {
    if (!currentReference || !nextReference) {
      return "next";
    }

    const currentBook = stripAccents(currentReference.book);
    const nextBook = stripAccents(nextReference.book);
    const currentBookIndex = BOOK_ORDER.indexOf(currentBook);
    const nextBookIndex = BOOK_ORDER.indexOf(nextBook);
    let direction = "next";

    if (currentBookIndex !== -1 && nextBookIndex !== -1 && nextBookIndex < currentBookIndex) {
      direction = "back";
    } else if (nextBook === currentBook) {
      if (nextReference.chapter < currentReference.chapter) {
        direction = "back";
      } else if (
        nextReference.chapter === currentReference.chapter &&
        nextReference.verse < currentReference.verse
      ) {
        direction = "back";
      }
    }

    return direction;
  }

  function extractHeader(headerHtml) {
    const header = window.Holyrics.textFromHtml(headerHtml);
    return header || String(headerHtml || "").replace(/<\/?desc>/g, "").trim();
  }

  function extractBibleText(textHtml) {
    const template = window.Holyrics.parseHtmlFragment(textHtml);
    const content = template.content.querySelector("ctt");
    return content ? content.textContent.trim() : window.Holyrics.extractText(textHtml);
  }

  function extractTranslation(textHtml) {
    const template = window.Holyrics.parseHtmlFragment(textHtml);
    const spans = Array.from(template.content.querySelectorAll("span"))
      .map((span) => span.textContent.replace(/[()]/g, "").trim())
      .filter(Boolean);

    return spans[spans.length - 1] || "";
  }

  function fitBibleText(element) {
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

  function createHeader(data) {
    const header = document.createElement("h1");
    header.className = "bible-header";
    header.textContent = data.header;
    return header;
  }

  function createText(data) {
    const text = document.createElement("p");
    text.className = "bible-text";
    text.textContent = data.text;
    fitBibleText(text);
    return text;
  }

  function createTranslation(data) {
    const translation = document.createElement("p");
    translation.className = "bible-translation";
    translation.textContent = data.translation;
    return translation;
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

  async function replaceElementAfterExit(currentElement, nextElement, exitClass, enterClass) {
    const parent = currentElement.parentElement;
    const nextSibling = currentElement.nextSibling;

    animate(currentElement, exitClass);
    await waitForMotion();

    if (currentElement.parentElement) {
      currentElement.remove();
    }

    if (parent) {
      parent.insertBefore(nextElement, nextSibling);
      animate(nextElement, enterClass);
      await waitForMotion();
    }
  }

  function isSameBook(currentData, nextData) {
    if (!currentData.reference || !nextData.reference) {
      return currentData.header === nextData.header;
    }

    return stripAccents(currentData.reference.book) === stripAccents(nextData.reference.book);
  }

  window.HolyricsRenderer = {
    animation() {
      return {
        enterClass: "animate__fadeIn",
        exitClass: "animate__fadeOut",
      };
    },

    normalize(map) {
      const header = extractHeader(map.header);

      return {
        header,
        text: extractBibleText(map.text),
        translation: extractTranslation(map.text),
        reference: parseReference(header),
      };
    },

    render(data) {
      const wrapper = document.createElement("section");
      wrapper.className = "bible";
      wrapper.append(createHeader(data), createText(data), createTranslation(data));
      return wrapper;
    },

    async transition({ currentNode, currentData, nextData }) {
      const tasks = [];
      const currentHeader = currentNode.querySelector(".bible-header");
      const currentText = currentNode.querySelector(".bible-text");
      const currentTranslation = currentNode.querySelector(".bible-translation");

      resetAnimation(currentNode);

      if (currentData.header !== nextData.header) {
        if (isSameBook(currentData, nextData)) {
          currentHeader.textContent = nextData.header;
        } else {
          tasks.push(
            replaceElementAfterExit(
              currentHeader,
              createHeader(nextData),
              "animate__fadeOutTop",
              "animate__fadeIn"
            )
          );
        }
      }

      if (currentData.text !== nextData.text) {
        const direction = directionFor(currentData.reference, nextData.reference);
        tasks.push(
          direction === "back"
            ? replaceElementAfterExit(
                currentText,
                createText(nextData),
                "animate__fadeOutRight",
                "animate__fadeInLeft"
              )
            : replaceElementAfterExit(
                currentText,
                createText(nextData),
                "animate__fadeOutLeft",
                "animate__fadeInRight"
              )
        );
      }

      if (currentData.translation !== nextData.translation) {
        tasks.push(
          replaceElementAfterExit(
            currentTranslation,
            createTranslation(nextData),
            "animate__fadeOutBottom",
            "animate__fadeIn"
          )
        );
      }

      if (tasks.length) {
        await Promise.all(tasks);
      }

      return true;
    },
  };
})();
