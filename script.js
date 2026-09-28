/**
 * Modeira one-page site interactions.
 * No framework is used so the page stays fast and easy to hand over.
 */

document.documentElement.classList.add("js");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Sticky header, scroll progress and active navigation state.
const header = document.querySelector("[data-header]");
const progressBar = document.querySelector(".page-progress span");
let lastScrollY = window.scrollY;
let scrollTicking = false;

function updateScrollInterface() {
  const currentScrollY = window.scrollY;
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? currentScrollY / scrollableHeight : 0;

  header?.classList.toggle("is-scrolled", currentScrollY > 28);
  header?.classList.toggle(
    "is-hidden",
    currentScrollY > lastScrollY && currentScrollY > 480 && !document.body.classList.contains("menu-open"),
  );

  if (progressBar) {
    progressBar.style.transform = `scaleX(${Math.min(Math.max(progress, 0), 1)})`;
  }

  lastScrollY = Math.max(currentScrollY, 0);
  scrollTicking = false;
}

window.addEventListener(
  "scroll",
  () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(updateScrollInterface);
      scrollTicking = true;
    }
  },
  { passive: true },
);
updateScrollInterface();

// Mobile navigation.
const menuToggle = document.querySelector("[data-menu-toggle]");
const navigation = document.querySelector("[data-nav]");

function closeMenu() {
  menuToggle?.setAttribute("aria-expanded", "false");
  navigation?.classList.remove("is-open");
  document.body.classList.remove("menu-open");
}

menuToggle?.addEventListener("click", () => {
  const willOpen = menuToggle.getAttribute("aria-expanded") !== "true";
  menuToggle.setAttribute("aria-expanded", String(willOpen));
  navigation?.classList.toggle("is-open", willOpen);
  document.body.classList.toggle("menu-open", willOpen);
});

navigation?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

window.matchMedia("(min-width: 901px)").addEventListener("change", (event) => {
  if (event.matches) closeMenu();
});

// Reveal elements only when JavaScript is available.
const revealElements = document.querySelectorAll(".reveal");
if (reduceMotion || !("IntersectionObserver" in window)) {
  revealElements.forEach((element) => element.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8%", threshold: 0.12 },
  );
  revealElements.forEach((element) => revealObserver.observe(element));
}

// Animated key numbers. Numeric placeholders live in the HTML for easy editing.
function formatCounter(value) {
  return new Intl.NumberFormat("lt-LT").format(value);
}

function animateCounter(element) {
  const target = Number(element.dataset.counter || 0);
  const duration = 1500;
  const startedAt = performance.now();

  function frame(now) {
    const elapsed = Math.min((now - startedAt) / duration, 1);
    const eased = 1 - Math.pow(1 - elapsed, 4);
    element.textContent = formatCounter(Math.round(target * eased));
    if (elapsed < 1) window.requestAnimationFrame(frame);
  }

  window.requestAnimationFrame(frame);
}

const counterElements = document.querySelectorAll("[data-counter]");
if (reduceMotion || !("IntersectionObserver" in window)) {
  counterElements.forEach((counter) => {
    counter.textContent = formatCounter(Number(counter.dataset.counter || 0));
  });
} else {
  const counterObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.6 },
  );
  counterElements.forEach((counter) => counterObserver.observe(counter));
}

// Lightweight parallax; disabled for reduced motion and touch-like narrow layouts.
const parallaxMedia = document.querySelector("[data-parallax]");
if (parallaxMedia && !reduceMotion && window.matchMedia("(min-width: 901px)").matches) {
  let parallaxTicking = false;

  const updateParallax = () => {
    const offset = Math.min(window.scrollY * 0.12, 110);
    parallaxMedia.style.transform = `scale(1.06) translate3d(0, ${offset}px, 0)`;
    parallaxTicking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!parallaxTicking && window.scrollY < window.innerHeight * 1.3) {
        window.requestAnimationFrame(updateParallax);
        parallaxTicking = true;
      }
    },
    { passive: true },
  );
}

// Project filters.
const filterButtons = document.querySelectorAll("[data-filter]");
const projectCards = document.querySelectorAll("[data-category]");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedFilter = button.dataset.filter;

    filterButtons.forEach((item) => {
      const isCurrent = item === button;
      item.classList.toggle("is-active", isCurrent);
      item.setAttribute("aria-pressed", String(isCurrent));
    });

    projectCards.forEach((card) => {
      const categories = card.dataset.category.split(" ");
      const shouldShow = selectedFilter === "all" || categories.includes(selectedFilter);
      card.hidden = !shouldShow;
    });
  });
});

// Lead form: private-client filter, accessible validation and conversion event.
const leadForm = document.querySelector("#lead-form");
const clientType = document.querySelector("[data-client-type]");
const businessFields = document.querySelector("[data-business-fields]");
const privateMessage = document.querySelector("[data-private-message]");
const successState = document.querySelector("[data-form-success]");
const resetFormButton = document.querySelector("[data-form-reset]");
const formProgress = document.querySelector(".form-progress span");
const fileInput = document.querySelector("#drawings");
const fileLabel = document.querySelector("[data-file-label]");
const startDateInput = document.querySelector("#start-date");

if (startDateInput) {
  const today = new Date();
  const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];
  startDateInput.min = localToday;
}

function setBusinessFieldsAvailability(isPrivate) {
  if (!businessFields || !privateMessage) return;

  businessFields.hidden = isPrivate;
  privateMessage.hidden = !isPrivate;
  businessFields.querySelectorAll("input, select, textarea, button").forEach((control) => {
    control.disabled = isPrivate;
  });

  updateFormProgress();
}

clientType?.addEventListener("change", () => {
  setBusinessFieldsAvailability(clientType.value === "privatus-asmuo");
  clearFieldError(clientType);
});

function getFieldContainer(field) {
  return field?.closest(".field") || null;
}

function clearFieldError(field) {
  if (!field) return;
  const container = getFieldContainer(field);
  container?.classList.remove("has-error");
  field.removeAttribute("aria-invalid");

  const error = container?.querySelector(".field-error");
  if (error) error.textContent = "";

  if (field.name === "privacy") {
    const privacyError = leadForm?.querySelector(".privacy-error");
    if (privacyError) privacyError.textContent = "";
  }
}

function setFieldError(field, message) {
  const container = getFieldContainer(field);
  container?.classList.add("has-error");
  field.setAttribute("aria-invalid", "true");

  if (field.name === "privacy") {
    const privacyError = leadForm?.querySelector(".privacy-error");
    if (privacyError) privacyError.textContent = message;
    return;
  }

  const error = container?.querySelector(".field-error");
  if (error) error.textContent = message;
}

function validateField(field) {
  if (!field || field.disabled || field.type === "file") return true;
  clearFieldError(field);

  if (field.validity.valueMissing) {
    setFieldError(field, field.type === "checkbox" ? "Pažymėkite sutikimą." : "Užpildykite šį lauką.");
    return false;
  }

  if (field.id === "company-code" && !/^\d{9}$/.test(field.value.trim())) {
    setFieldError(field, "Įmonės kodą turi sudaryti 9 skaitmenys.");
    return false;
  }

  if (field.validity.typeMismatch) {
    setFieldError(field, "Įveskite galiojantį el. pašto adresą.");
    return false;
  }

  if (field.validity.tooShort) {
    setFieldError(field, `Įveskite bent ${field.minLength} simbolių.`);
    return false;
  }

  if (field.validity.rangeUnderflow) {
    setFieldError(field, "Įveskite didesnę nei 0 reikšmę.");
    return false;
  }

  if (!field.checkValidity()) {
    setFieldError(field, "Patikrinkite įvestą reikšmę.");
    return false;
  }

  return true;
}

function validateFile() {
  if (!fileInput?.files?.length) {
    clearFieldError(fileInput);
    return true;
  }

  const file = fileInput.files[0];
  const extension = file.name.split(".").pop()?.toLowerCase();
  const isSupported = ["pdf", "dwg"].includes(extension);
  const isWithinLimit = file.size <= 20 * 1024 * 1024;

  clearFieldError(fileInput);
  if (!isSupported) {
    setFieldError(fileInput, "Galima pridėti tik PDF arba DWG failą.");
    return false;
  }
  if (!isWithinLimit) {
    setFieldError(fileInput, "Failas negali būti didesnis nei 20 MB.");
    return false;
  }
  return true;
}

function updateFormProgress() {
  if (!leadForm || !formProgress) return;
  const requiredFields = [...leadForm.querySelectorAll("[required]")].filter((field) => !field.disabled);
  const completedFields = requiredFields.filter((field) => {
    if (field.type === "checkbox") return field.checked;
    return field.value.trim() !== "";
  });
  const completion = requiredFields.length ? (completedFields.length / requiredFields.length) * 100 : 0;
  formProgress.style.width = `${completion}%`;
}

leadForm?.querySelectorAll("input, select, textarea").forEach((field) => {
  field.addEventListener("input", () => {
    clearFieldError(field);
    updateFormProgress();
  });
  field.addEventListener("change", updateFormProgress);
  field.addEventListener("blur", () => {
    if (field.required && (field.value || field.type === "checkbox")) validateField(field);
  });
});

fileInput?.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (fileLabel) fileLabel.textContent = file ? file.name : "Pridėti PDF arba DWG failą";
  validateFile();
});

leadForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (clientType?.value === "privatus-asmuo") return;

  const requiredFields = [...leadForm.querySelectorAll("[required]")].filter((field) => !field.disabled);
  const fieldsAreValid = requiredFields.map(validateField).every(Boolean);
  const fileIsValid = validateFile();

  if (!fieldsAreValid || !fileIsValid) {
    leadForm.querySelector("[aria-invalid='true']")?.focus();
    return;
  }

  // Replace this demo state with the production form endpoint integration.
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "b2b_lead",
    lead_type: clientType?.value || "nepasirinkta",
    object_type: leadForm.elements.object_type?.value || "nepasirinkta",
    has_attachment: Boolean(fileInput?.files?.length),
  });

  leadForm.hidden = true;
  if (successState) {
    successState.hidden = false;
    successState.focus();
  }
});

resetFormButton?.addEventListener("click", () => {
  leadForm?.reset();
  if (leadForm) leadForm.hidden = false;
  if (successState) successState.hidden = true;
  if (fileLabel) fileLabel.textContent = "Pridėti PDF arba DWG failą";
  setBusinessFieldsAvailability(false);
  leadForm?.querySelectorAll("[aria-invalid]").forEach((field) => clearFieldError(field));
  updateFormProgress();
  clientType?.focus();
});

updateFormProgress();

// Highlight navigation links as sections pass the viewport.
const navLinks = [...document.querySelectorAll(".primary-nav a")];
const linkedSections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    { rootMargin: "-35% 0px -55%", threshold: 0 },
  );
  linkedSections.forEach((section) => sectionObserver.observe(section));
}

// Consent Mode v2. Analytics stays denied unless the visitor explicitly accepts.
const cookieBanner = document.querySelector("[data-cookie-banner]");
const cookieAccept = document.querySelector("[data-cookie-accept]");
const cookieDecline = document.querySelector("[data-cookie-decline]");
const cookieSettings = document.querySelector("[data-cookie-settings]");
const consentKey = "modeira_cookie_consent";
let analyticsLoaded = false;

function loadAnalytics() {
  if (analyticsLoaded) return;
  analyticsLoaded = true;

  window.gtag?.("consent", "update", {
    ad_storage: "granted",
    analytics_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
  });

  const analyticsScript = document.createElement("script");
  analyticsScript.async = true;
  analyticsScript.src = "https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX";
  document.head.append(analyticsScript);

  window.gtag?.("js", new Date());
  window.gtag?.("config", "G-XXXXXXXXXX", { anonymize_ip: true });
}

function saveConsent(choice) {
  try {
    localStorage.setItem(consentKey, choice);
  } catch {
    // Private browsing can block localStorage; consent still applies for this page view.
  }

  if (choice === "accepted") {
    loadAnalytics();
  } else {
    window.gtag?.("consent", "update", {
      ad_storage: "denied",
      analytics_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  }

  if (cookieBanner) cookieBanner.hidden = true;
}

function getSavedConsent() {
  try {
    return localStorage.getItem(consentKey);
  } catch {
    return null;
  }
}

const savedConsent = getSavedConsent();
if (savedConsent === "accepted") {
  loadAnalytics();
} else if (!savedConsent && cookieBanner) {
  window.setTimeout(() => {
    cookieBanner.hidden = false;
  }, 600);
}

cookieAccept?.addEventListener("click", () => saveConsent("accepted"));
cookieDecline?.addEventListener("click", () => saveConsent("declined"));
cookieSettings?.addEventListener("click", () => {
  if (cookieBanner) {
    cookieBanner.hidden = false;
    cookieBanner.querySelector("button")?.focus();
  }
});
