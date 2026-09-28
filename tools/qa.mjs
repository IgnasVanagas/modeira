import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const baseUrl = process.env.QA_URL || "http://127.0.0.1:4173";
fs.mkdirSync(path.resolve("artifacts"), { recursive: true });
const browser = await chromium.launch({ executablePath: chromePath, headless: true });

async function triggerScrollReveals(page) {
  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const viewportHeight = page.viewportSize().height;
  for (let y = 0; y < pageHeight; y += Math.round(viewportHeight * 0.72)) {
    await page.evaluate((position) => window.scrollTo(0, position), y);
    await page.waitForTimeout(90);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
}

async function assertHeroFitsViewport(page) {
  const viewport = page.viewportSize();
  const boxes = await page.evaluate(() => {
    const readBox = (selector) => {
      const element = document.querySelector(selector);
      const box = element.getBoundingClientRect();
      return { top: box.top, bottom: box.bottom, height: box.height };
    };
    return {
      hero: readBox(".hero"),
      copy: readBox(".hero-copy"),
      actions: readBox(".hero-actions"),
    };
  });

  assert.ok(boxes.hero.height <= viewport.height + 1, "Hero is taller than the opening viewport");
  assert.ok(boxes.copy.bottom <= viewport.height + 1, "Hero copy extends below the opening viewport");
  assert.ok(boxes.actions.bottom <= viewport.height + 1, "Hero actions extend below the opening viewport");
}

try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  await desktop.goto(baseUrl, { waitUntil: "networkidle" });
  await assertHeroFitsViewport(desktop);

  assert.equal(await desktop.title(), "Modeira — plokšti stogai ir hidroizoliacija verslui");
  assert.equal(await desktop.locator("h1").count(), 1);
  assert.equal(await desktop.locator("[data-category]").count(), 6);

  const projectPhotoBoxes = await desktop.locator(".project-card figure").evaluateAll((figures) =>
    figures.map((figure) => {
      const box = figure.getBoundingClientRect();
      return { top: Math.round(box.top), height: Math.round(box.height) };
    }),
  );
  for (const [left, right] of [[0, 1], [2, 3], [4, 5]]) {
    assert.ok(Math.abs(projectPhotoBoxes[left].top - projectPhotoBoxes[right].top) <= 1, "Project row tops differ");
    assert.ok(Math.abs(projectPhotoBoxes[left].height - projectPhotoBoxes[right].height) <= 1, "Project photo heights differ");
  }

  const horizontalOverflow = await desktop.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  assert.equal(horizontalOverflow, false, "Desktop view has horizontal overflow");

  await desktop.locator("[data-cookie-decline]").click();

  for (const filter of ["industrial", "commercial", "renovation", "waterproofing"]) {
    await desktop.locator(`[data-filter='${filter}']`).click();
    const visibleHeights = await desktop
      .locator("[data-category]:visible figure")
      .evaluateAll((figures) => figures.map((figure) => Math.round(figure.getBoundingClientRect().height)));
    assert.equal(new Set(visibleHeights).size, 1, `Project photos differ in the ${filter} filter`);
  }
  await desktop.locator("[data-filter='all']").click();

  await desktop.locator("#client-type").selectOption("privatus-asmuo");
  assert.equal(await desktop.locator("[data-private-message]").isVisible(), true);
  assert.equal(await desktop.locator("[data-business-fields]").isHidden(), true);

  await desktop.locator("#client-type").selectOption("imone");
  await desktop.locator("#company-name").fill("UAB Testas");
  await desktop.locator("#company-code").fill("123");
  await desktop.locator("#contact-person").fill("Testas Testaitis");
  await desktop.locator("#email").fill("testas@example.com");
  await desktop.locator("#object-type").selectOption("komercinis");
  await desktop.locator("#roof-area").fill("1500");
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  await desktop.locator("#start-date").fill(tomorrow);
  await desktop.locator("#description").fill("Komercinio objekto stogo įrengimo darbų užklausa.");
  await desktop.locator("[name='privacy']").check();
  await desktop.locator("#lead-form button[type='submit']").click();
  assert.match(await desktop.locator("#company-code").getAttribute("aria-invalid"), /true/);

  await desktop.locator("#company-code").fill("123456789");
  await desktop.locator("#lead-form button[type='submit']").click();
  assert.equal(await desktop.locator("[data-form-success]").isVisible(), true);
  assert.equal(
    await desktop.evaluate(() => window.dataLayer.some((entry) => entry?.event === "b2b_lead")),
    true,
  );

  await triggerScrollReveals(desktop);

  await desktop.screenshot({
    path: path.resolve("artifacts", "modeira-desktop.png"),
    fullPage: true,
  });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await mobile.goto(baseUrl, { waitUntil: "networkidle" });
  await assertHeroFitsViewport(mobile);
  const mobileOverflow = await mobile.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  assert.equal(mobileOverflow, false, "Mobile view has horizontal overflow");
  const mobileProjectHeights = await mobile
    .locator(".project-card figure")
    .evaluateAll((figures) => figures.map((figure) => Math.round(figure.getBoundingClientRect().height)));
  assert.equal(new Set(mobileProjectHeights).size, 1, "Mobile project photo heights differ");

  await mobile.locator("[data-menu-toggle]").click();
  await mobile.waitForTimeout(320);
  assert.equal(await mobile.locator("[data-nav]").isVisible(), true);
  assert.equal(await mobile.locator("[data-menu-toggle]").getAttribute("aria-expanded"), "true");
  await mobile.locator("[data-nav] a[href='#paslaugos']").click();
  assert.equal(await mobile.locator("[data-menu-toggle]").getAttribute("aria-expanded"), "false");

  await mobile.locator("[data-cookie-decline]").click();
  await triggerScrollReveals(mobile);
  await mobile.screenshot({
    path: path.resolve("artifacts", "modeira-mobile.png"),
    fullPage: true,
  });

  console.log("QA patikra baigta sėkmingai: darbalaukis, mobilus vaizdas, filtrai ir forma.");
} finally {
  await browser.close();
}
