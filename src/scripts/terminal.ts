// terminal.ts — typewriter intro + SPA-like tab transitions.
// Loaded from Terminal.astro on every page; everything is feature-detected
// so the site degrades gracefully without JS.

const SESSION_KEY = "iker.sh:intro-played";
const TAB_PATHS: Record<string, string> = {
  "/": "~",
  "/projects/": "~/projects",
  "/reading/": "~/reading",
};

function init(): void {
  setupIntro();
  setupNavigation();
}

// ──────────────────────────────────────────────────────────────────────────────
// Typewriter intro
// ──────────────────────────────────────────────────────────────────────────────

function setupIntro(): void {
  const intro = document.querySelector<HTMLElement>("[data-intro]");
  const skipHint = document.querySelector<HTMLElement>("[data-skip-hint]");
  if (!intro) return;

  // Only run on the about page (path "/").
  if (window.location.pathname !== "/") return;

  // Once-per-session gate.
  let alreadyPlayed = false;
  try {
    alreadyPlayed = sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    // sessionStorage may be unavailable (private mode); just play it.
  }
  if (alreadyPlayed) return;

  const promptLine = intro.querySelector<HTMLElement>(".prompt-line");
  const commandSpan =
    promptLine?.querySelector<HTMLElement>(".command") ?? null;
  const catOutput = intro.querySelector<HTMLElement>(".cat-output");
  if (!promptLine || !commandSpan || !catOutput) return;

  const fullCommand = commandSpan.textContent ?? "";
  commandSpan.textContent = "";
  catOutput.style.opacity = "0";
  catOutput.style.transition = "opacity 0.2s ease-in";

  if (skipHint) {
    skipHint.hidden = false;
  }

  let skipped = false;
  let timeoutId: number | null = null;
  const sleep = (ms: number) =>
    new Promise<void>((resolve) => {
      timeoutId = window.setTimeout(resolve, ms);
    });

  function finish(): void {
    if (skipped) return;
    skipped = true;
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (commandSpan) commandSpan.textContent = fullCommand;
    if (catOutput) catOutput.style.opacity = "1";
    if (skipHint) skipHint.hidden = true;
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("keydown", onKey, true);
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  function onClick(e: MouseEvent): void {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    if (target.closest("a") || target.closest(".tab")) return;
    finish();
  }

  function onKey(e: KeyboardEvent): void {
    // Don't swallow modifier-only or navigation events the user may want
    // (cmd-r, cmd-l, etc.).
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    finish();
    e.preventDefault();
  }

  document.addEventListener("click", onClick, true);
  document.addEventListener("keydown", onKey, true);

  void (async () => {
    const delay = Math.max(25, Math.min(55, 700 / fullCommand.length));
    await sleep(400);
    if (skipped) return;
    for (let i = 0; i < fullCommand.length; i++) {
      if (skipped) return;
      commandSpan.textContent = fullCommand.substring(0, i + 1);
      await sleep(delay);
    }
    if (skipped) return;
    await sleep(150);
    if (skipped) return;
    catOutput.style.opacity = "1";
    finish();
  })();
}

// ──────────────────────────────────────────────────────────────────────────────
// SPA-like navigation: intercept tab + file-row clicks, fetch, swap pane.
// ──────────────────────────────────────────────────────────────────────────────

function setupNavigation(): void {
  if (!("fetch" in window) || !("pushState" in window.history)) return;

  document.addEventListener("click", handleClick);
  window.addEventListener("popstate", () =>
    loadUrl(window.location.href, false),
  );
}

function handleClick(e: MouseEvent): void {
  if (e.defaultPrevented) return;
  if (e.button !== 0) return;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

  const target = e.target as HTMLElement | null;
  if (!target) return;

  const anchor = target.closest("a") as HTMLAnchorElement | null;
  if (!anchor) return;
  if (anchor.target && anchor.target !== "_self") return;
  if (anchor.hasAttribute("download")) return;
  if (anchor.getAttribute("rel")?.includes("external")) return;

  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return;

  // Only intercept internal page navigation; let hash-only links work natively.
  if (
    url.pathname === window.location.pathname &&
    url.search === window.location.search &&
    url.hash
  ) {
    return;
  }

  e.preventDefault();
  void loadUrl(url.href, true);
}

async function loadUrl(href: string, push: boolean): Promise<void> {
  try {
    const res = await fetch(href, {
      headers: { Accept: "text/html" },
      credentials: "same-origin",
    });
    if (!res.ok) {
      window.location.href = href;
      return;
    }
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, "text/html");

    const newPane = doc.querySelector<HTMLElement>("[data-pane-container]");
    const currentPane = document.querySelector<HTMLElement>(
      "[data-pane-container]",
    );
    if (!newPane || !currentPane) {
      window.location.href = href;
      return;
    }

    currentPane.innerHTML = newPane.innerHTML;

    // Update <title>.
    const newTitle = doc.querySelector("title")?.textContent;
    if (newTitle) document.title = newTitle;

    // Update title bar path.
    const newTitleText = doc.querySelector<HTMLElement>("[data-title-text]");
    const currentTitleText =
      document.querySelector<HTMLElement>("[data-title-text]");
    if (newTitleText && currentTitleText) {
      currentTitleText.textContent = newTitleText.textContent;
    } else {
      const url = new URL(href);
      const path = TAB_PATHS[url.pathname] ?? guessPath(url.pathname);
      if (currentTitleText) {
        currentTitleText.textContent = `iker@iker.sh: ${path}`;
      }
    }

    // Update active tab.
    const newActive = doc
      .querySelector(".tab.active")
      ?.getAttribute("data-tab");
    if (newActive) {
      document.querySelectorAll<HTMLElement>(".tab").forEach((t) => {
        t.classList.toggle("active", t.dataset.tab === newActive);
      });
    }

    if (push) {
      window.history.pushState({}, "", href);
    }

    currentPane.scrollTop = 0;
    window.scrollTo(0, 0);
  } catch {
    window.location.href = href;
  }
}

function guessPath(pathname: string): string {
  if (pathname.startsWith("/projects/")) {
    const slug = pathname.replace(/^\/projects\//, "").replace(/\/$/, "");
    return slug ? `~/projects/${slug}` : "~/projects";
  }
  if (pathname.startsWith("/reading")) return "~/reading";
  return "~";
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
