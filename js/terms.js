
const termsContent = document.getElementById("terms-content");

const termsFiles = {
  en: "../data/tos/tos-en.md",
  ru: "../data/tos/tos-ru.md",
};

const termsStatusKeys = {
  loading: "terms.loading",
  error: "terms.error",
  empty: "terms.empty",
};

function getCurrentLanguage() {
  return document.documentElement.lang === "ru" ? "ru" : "en";
}

function getTranslation(key) {
  return key.split(".").reduce(
    (value, part) => value?.[part],
    window.siteTranslations || {}
  ) || key;
}

function showStatus(key) {
  const paragraph = document.createElement("p");
  paragraph.className = "terms_status";
  paragraph.textContent = getTranslation(key);

  termsContent.replaceChildren(paragraph);
}

async function loadTerms() {
  const language = getCurrentLanguage();
  const file = termsFiles[language];

  showStatus(termsStatusKeys.loading);

  try {
    const response = await fetch(file);

    if (!response.ok) {
      throw new Error(`Failed to load terms: ${response.status}`);
    }

    const markdown = await response.text();

    if (!markdown.trim()) {
      showStatus(termsStatusKeys.empty);
      return;
    }

    if (!window.marked) {
      throw new Error("Markdown parser is unavailable");
    }

    // The Markdown files are authored and maintained by the site owner.
    // Disable raw HTML in Markdown to reduce injection risks.
    const html = window.marked.parse(markdown, {
      gfm: true,
      breaks: false,
      mangle: false,
      headerIds: false,
    });

    const template = document.createElement("template");
    template.innerHTML = html;

    // Do not allow raw HTML or executable elements from Markdown.
    template.content.querySelectorAll(
      "script, style, iframe, object, embed, form, input, button, textarea, select, link, meta, base, svg, math"
    ).forEach((element) => element.remove());

    template.content.querySelectorAll("*").forEach((element) => {
      [...element.attributes].forEach((attribute) => {
        const name = attribute.name.toLowerCase();
        const value = attribute.value.trim().toLowerCase();

        if (
          name.startsWith("on") ||
          name === "style" ||
          ((name === "href" || name === "src") &&
            (value.startsWith("javascript:") ||
              value.startsWith("data:")))
        ) {
          element.removeAttribute(attribute.name);
        }
      });
    });

    termsContent.replaceChildren(template.content);
  } catch (error) {
    console.error("Terms loading error:", error);
    showStatus(termsStatusKeys.error);
  }
}

document.addEventListener("languageChanged", loadTerms);

loadTerms();
