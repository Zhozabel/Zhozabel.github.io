
const LANGUAGE_KEY = "zhozabel-language";
const DEFAULT_LANGUAGE = "en";
const SUPPORTED_LANGUAGES = ["en", "ru"];

const scriptElement = document.currentScript;

const localesDirectory = new URL(
  "../locales/",
  scriptElement.src
);

let currentTranslations = {};

function getTranslation(key) {
  return key.split(".").reduce((value, part) => {
    return value?.[part];
  }, currentTranslations);
}

async function setLanguage(language) {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    language = DEFAULT_LANGUAGE;
  }

  try {
    const url = new URL(`${language}.json`, localesDirectory);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to load ${language}.json`);
    }

    const translations = await response.json();

    currentTranslations = translations;
    window.siteTranslations = translations;

    document.documentElement.lang = language;
    document.title = getTranslation("meta.title") || "Zhozabel";

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const value = getTranslation(element.dataset.i18n);

      if (typeof value === "string") {
        element.textContent = value;
      }
    });

    document.querySelectorAll("[data-lang-switch]").forEach((button) => {
      const isActive = button.dataset.langSwitch === language;

      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
      const value = getTranslation(element.dataset.i18nAriaLabel);

      if (typeof value === "string") {
        element.setAttribute("aria-label", value);
      }
    });

    localStorage.setItem(LANGUAGE_KEY, language);
    document.dispatchEvent(
      new CustomEvent("languageChanged", {
        detail: { language }
      })
    );
  } catch (error) {
    console.error("Localization error:", error);
  }
}

document.querySelectorAll("[data-lang-switch]").forEach((button) => {
  button.addEventListener("click", () => {
    setLanguage(button.dataset.langSwitch);
  });
});

const savedLanguage = localStorage.getItem(LANGUAGE_KEY);
const initialLanguage = SUPPORTED_LANGUAGES.includes(savedLanguage)
  ? savedLanguage
  : DEFAULT_LANGUAGE;

setLanguage(initialLanguage);
