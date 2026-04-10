// terminal.ts — SPA-like navigation plus the REPL that powers the home page.
// Loaded from Terminal.astro on every page; everything is feature-detected
// so the site degrades gracefully without JS.

const REPL_HISTORY_KEY = "iker.sh:repl-history";
const AUTORUN_KEY = "iker.sh:autorun-played";
const MAX_HISTORY = 50;

function init(): void {
  setupNavigation();
  setupPage();
}

// Runs on first load and after every SPA navigation, because the pane's
// innerHTML is replaced wholesale and any per-page closures are discarded.
function setupPage(): void {
  setupRepl();
}

// ──────────────────────────────────────────────────────────────────────────────
// REPL (interactive prompt on the home page)
// ──────────────────────────────────────────────────────────────────────────────

interface ReplContext {
  historyEl: HTMLElement;
  input: HTMLInputElement;
  projects: string[];
}

function setupRepl(): void {
  const repl = document.querySelector<HTMLElement>("[data-repl]");
  if (!repl) return;

  const input = repl.querySelector<HTMLInputElement>("[data-repl-input]");
  const historyEl = repl.querySelector<HTMLElement>("[data-repl-history]");
  if (!input || !historyEl) return;

  let projects: string[] = [];
  try {
    projects = JSON.parse(repl.dataset.projects ?? "[]") as string[];
  } catch {
    projects = [];
  }

  const ctx: ReplContext = { historyEl, input, projects };

  let cmdHistory: string[] = [];
  try {
    const stored = sessionStorage.getItem(REPL_HISTORY_KEY);
    if (stored) cmdHistory = JSON.parse(stored) as string[];
  } catch {
    cmdHistory = [];
  }
  let historyIdx = cmdHistory.length;
  let draft = "";

  // Focus the input when you click anywhere in the pane (unless you're
  // selecting text or clicking a link).
  const pane = document.querySelector<HTMLElement>("[data-pane]");
  pane?.addEventListener("click", (e) => {
    const t = e.target as HTMLElement | null;
    if (!t) return;
    if (t.closest("a")) return;
    if (t instanceof HTMLInputElement) return;
    const sel = window.getSelection();
    if (sel && sel.toString().length > 0) return;
    input.focus({ preventScroll: true });
  });

  // Elements with [data-repl-cmd] run that command on click (used by the MOTD).
  document.querySelectorAll<HTMLElement>("[data-repl-cmd]").forEach((el) => {
    el.style.cursor = "pointer";
    el.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const cmd = el.dataset.replCmd ?? "";
      input.focus({ preventScroll: true });
      runReplCommand(cmd, ctx);
      scrollPaneToBottom();
    });
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const raw = input.value;
      input.value = "";
      const trimmed = raw.trim();
      if (trimmed && trimmed !== cmdHistory[cmdHistory.length - 1]) {
        cmdHistory.push(trimmed);
        if (cmdHistory.length > MAX_HISTORY) cmdHistory.shift();
        try {
          sessionStorage.setItem(REPL_HISTORY_KEY, JSON.stringify(cmdHistory));
        } catch {
          /* ignore */
        }
      }
      historyIdx = cmdHistory.length;
      draft = "";
      runReplCommand(raw, ctx);
      scrollPaneToBottom();
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      if (historyIdx === cmdHistory.length) draft = input.value;
      if (historyIdx > 0) {
        historyIdx--;
        input.value = cmdHistory[historyIdx];
        moveCaretToEnd(input);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx < cmdHistory.length) {
        historyIdx++;
        input.value =
          historyIdx === cmdHistory.length ? draft : cmdHistory[historyIdx];
        moveCaretToEnd(input);
      }
      return;
    }

    if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      historyEl.innerHTML = "";
      return;
    }

    if (e.key === "c" && e.ctrlKey) {
      e.preventDefault();
      appendReplPrompt(historyEl, input.value + "^C");
      input.value = "";
      historyIdx = cmdHistory.length;
      draft = "";
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const completed = completeInput(input.value, ctx);
      if (completed.value !== input.value) {
        input.value = completed.value;
        moveCaretToEnd(input);
      }
      if (completed.suggestions.length > 1) {
        appendReplPrompt(historyEl, input.value);
        appendReplLine(
          historyEl,
          completed.suggestions
            .map((s) => `<span class="accent">${escapeHtml(s)}</span>`)
            .join("  "),
          true,
        );
        scrollPaneToBottom();
      }
      return;
    }
  });

  // Auto-focus on devices that don't have a popup soft keyboard (so mobile
  // visitors aren't assaulted on load).
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  if (!isTouch) input.focus({ preventScroll: true });

  // Auto-run a command on first load (once per session) if the REPL asked
  // for one via the [data-autorun] attribute. This is how the home page
  // boots with `cat about.md` already printed without a static intro block.
  const autorun = repl.dataset.autorun;
  if (autorun) {
    let played = false;
    try {
      played = sessionStorage.getItem(AUTORUN_KEY) === "1";
    } catch {
      /* ignore */
    }
    if (!played) {
      try {
        sessionStorage.setItem(AUTORUN_KEY, "1");
      } catch {
        /* ignore */
      }
      runReplCommand(autorun, ctx);
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Tab completion
// ──────────────────────────────────────────────────────────────────────────────

interface CompletionResult {
  value: string;
  suggestions: string[];
}

function completeInput(value: string, ctx: ReplContext): CompletionResult {
  // Tokenize preserving trailing whitespace state: if the user already typed
  // a space, we're completing a fresh arg, not extending the previous token.
  const trailing = /\s$/.test(value);
  const tokens = value.split(/\s+/).filter((t) => t.length > 0);

  // First-token completion: command names (including aliases).
  if (tokens.length === 0 || (tokens.length === 1 && !trailing)) {
    const prefix = tokens[0] ?? "";
    const names = Object.keys(REPL_COMMANDS);
    const matches = names.filter((n) => n.startsWith(prefix)).sort();
    if (matches.length === 0) return { value, suggestions: [] };
    if (matches.length === 1)
      return { value: matches[0] + " ", suggestions: [] };
    const common = longestCommonPrefix(matches);
    return {
      value: common.length > prefix.length ? common : value,
      suggestions: matches,
    };
  }

  // Arg completion: depends on the command.
  const cmd = tokens[0];
  const lastToken = trailing ? "" : tokens[tokens.length - 1];
  const head = trailing ? tokens.join(" ") : tokens.slice(0, -1).join(" ");

  let candidates: string[] = [];
  if (cmd === "cat") candidates = ["about.md"];
  else if (cmd === "open") candidates = ctx.projects;
  else if (cmd === "cd") candidates = ["projects", "reading", "~"];
  else return { value, suggestions: [] };

  const matches = candidates.filter((c) => c.startsWith(lastToken)).sort();
  if (matches.length === 0) return { value, suggestions: [] };
  if (matches.length === 1) {
    return { value: `${head} ${matches[0]} `, suggestions: [] };
  }
  const common = longestCommonPrefix(matches);
  return {
    value: common.length > lastToken.length ? `${head} ${common}` : value,
    suggestions: matches,
  };
}

function longestCommonPrefix(strs: string[]): string {
  if (strs.length === 0) return "";
  let prefix = strs[0];
  for (let i = 1; i < strs.length; i++) {
    while (strs[i].indexOf(prefix) !== 0) {
      prefix = prefix.slice(0, -1);
      if (prefix === "") return "";
    }
  }
  return prefix;
}

function runReplCommand(raw: string, ctx: ReplContext): void {
  const trimmed = raw.trim();
  appendReplPrompt(ctx.historyEl, trimmed);
  if (!trimmed) return;

  const parts = trimmed.split(/\s+/);
  const cmd = parts[0];
  const args = parts.slice(1);

  const handler = REPL_COMMANDS[cmd];
  if (handler) {
    handler(args, ctx);
  } else {
    appendReplLine(
      ctx.historyEl,
      `iker.sh: ${escapeHtml(cmd)}: command not found`,
    );
  }
}

type CommandHandler = (args: string[], ctx: ReplContext) => void;

const REPL_COMMANDS: Record<string, CommandHandler> = {
  help: (_, ctx) => {
    appendReplLine(
      ctx.historyEl,
      `commands:
  <span class="accent">about</span>             print about.md (alias for cat about.md)
  <span class="accent">projects</span>          open the projects page
  <span class="accent">reading</span>           open the reading log
  <span class="accent">help</span>              show this message
  <span class="accent">ls</span>                list files in ~
  <span class="accent">cat</span> &lt;file&gt;        print a file
  <span class="accent">cd</span> &lt;dir&gt;          change directory (projects, reading, ~)
  <span class="accent">open</span> &lt;slug&gt;       open a project by slug
  <span class="accent">pwd</span>               print working directory
  <span class="accent">whoami</span>            print current user
  <span class="accent">echo</span> &lt;text&gt;       print text
  <span class="accent">history</span>           show command history
  <span class="accent">clear</span>             clear the terminal

<span class="dim">tips: ↑/↓ recall commands · tab complete · ctrl+l clear · ctrl+c cancel</span>`,
      true,
    );
  },

  about: (_, ctx) => {
    REPL_COMMANDS.cat(["about.md"], ctx);
  },

  projects: (_, __) => {
    void loadUrl("/projects/", true);
  },

  reading: (_, __) => {
    void loadUrl("/reading/", true);
  },

  ls: (args, ctx) => {
    const long = args.some((a) => /^-[la]+$/.test(a));
    if (long) {
      appendReplLine(
        ctx.historyEl,
        `<span class="dim">-rw-r--r--  iker  2.1K  Apr  7 2026</span>  about.md
<span class="dim">drwxr-xr-x  iker   12K  Apr  7 2026</span>  <span class="dir-name">projects/</span>
<span class="dim">drwxr-xr-x  iker  1.2K  Apr  7 2026</span>  <span class="dir-name">reading/</span>`,
        true,
      );
    } else {
      appendReplLine(
        ctx.historyEl,
        `about.md  <span class="dir-name">projects/</span>  <span class="dir-name">reading/</span>`,
        true,
      );
    }
  },

  cat: (args, ctx) => {
    const f = args[0];
    if (!f) {
      appendReplLine(ctx.historyEl, "cat: missing file operand");
      return;
    }
    if (f === "about.md" || f === "~/about.md" || f === "./about.md") {
      const src = document.querySelector<HTMLElement>("[data-about-content]");
      if (src) {
        const div = document.createElement("div");
        div.className = "repl-output cat-output";
        div.innerHTML = src.innerHTML;
        ctx.historyEl.appendChild(div);
      } else {
        appendReplLine(
          ctx.historyEl,
          `<span class="dim">(about.md is rendered above — scroll up)</span>`,
          true,
        );
      }
    } else {
      appendReplLine(
        ctx.historyEl,
        `cat: ${escapeHtml(f)}: no such file or directory`,
      );
    }
  },

  cd: (args, ctx) => {
    const dir = args[0] ?? "~";
    const normalized = dir
      .replace(/^~\//, "")
      .replace(/^\.\//, "")
      .replace(/\/$/, "");
    switch (normalized) {
      case "":
      case "~":
      case ".":
        appendReplLine(
          ctx.historyEl,
          `<span class="dim">(already in ~)</span>`,
          true,
        );
        return;
      case "projects":
        void loadUrl("/projects/", true);
        return;
      case "reading":
        void loadUrl("/reading/", true);
        return;
      default:
        appendReplLine(
          ctx.historyEl,
          `cd: ${escapeHtml(dir)}: no such directory`,
        );
    }
  },

  open: (args, ctx) => {
    const slug = args[0];
    if (!slug) {
      appendReplLine(
        ctx.historyEl,
        `open: missing slug operand <span class="dim">(try ${ctx.projects
          .slice(0, 2)
          .map((s) => `<span class="accent">open ${escapeHtml(s)}</span>`)
          .join(", ")})</span>`,
        true,
      );
      return;
    }
    if (ctx.projects.includes(slug)) {
      void loadUrl(`/projects/${slug}/`, true);
    } else {
      appendReplLine(
        ctx.historyEl,
        `open: ${escapeHtml(slug)}: unknown project <span class="dim">(try <span class="accent">cd projects</span> to list them)</span>`,
        true,
      );
    }
  },

  pwd: (_, ctx) => {
    appendReplLine(ctx.historyEl, "/home/iker");
  },

  whoami: (_, ctx) => {
    appendReplLine(ctx.historyEl, "iker");
  },

  echo: (args, ctx) => {
    appendReplLine(ctx.historyEl, args.join(" "));
  },

  clear: (_, ctx) => {
    ctx.historyEl.innerHTML = "";
  },

  history: (_, ctx) => {
    let stored: string[] = [];
    try {
      stored = JSON.parse(
        sessionStorage.getItem(REPL_HISTORY_KEY) ?? "[]",
      ) as string[];
    } catch {
      stored = [];
    }
    if (stored.length === 0) {
      appendReplLine(
        ctx.historyEl,
        `<span class="dim">(no history yet)</span>`,
        true,
      );
      return;
    }
    const html = stored
      .map(
        (c, i) =>
          `<span class="dim">${String(i + 1).padStart(4, " ")}</span>  ${escapeHtml(c)}`,
      )
      .join("\n");
    appendReplLine(ctx.historyEl, html, true);
  },

  sudo: (_, ctx) => {
    appendReplLine(
      ctx.historyEl,
      `iker is not in the sudoers file. this incident will be reported.`,
    );
  },

  exit: (_, ctx) => {
    appendReplLine(ctx.historyEl, `<span class="dim">nope.</span>`, true);
  },
};

function appendReplPrompt(el: HTMLElement, cmd: string): void {
  const line = document.createElement("div");
  line.className = "prompt-line repl-echo";
  line.innerHTML = `<span class="prompt"><span class="user">iker</span>@<span class="host">iker.sh</span>:<span class="path">~</span><span class="dollar"> $</span></span> <span class="command">${escapeHtml(cmd)}</span>`;
  el.appendChild(line);
}

function appendReplLine(el: HTMLElement, body: string, html = false): void {
  const div = document.createElement("div");
  div.className = "repl-output";
  if (html) {
    div.innerHTML = body;
  } else {
    div.textContent = body;
  }
  el.appendChild(div);
}

function moveCaretToEnd(input: HTMLInputElement): void {
  requestAnimationFrame(() => {
    const n = input.value.length;
    input.setSelectionRange(n, n);
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return c;
    }
  });
}

function scrollPaneToBottom(): void {
  const pane = document.querySelector<HTMLElement>("[data-pane-container]");
  if (pane) pane.scrollTop = pane.scrollHeight;
}

// ──────────────────────────────────────────────────────────────────────────────
// SPA-like navigation: intercept internal anchor clicks, fetch, swap pane.
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

  // Let hash-only links work natively.
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

    const newTitle = doc.querySelector("title")?.textContent;
    if (newTitle) document.title = newTitle;

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

    // Re-run page-specific setup since the pane DOM was replaced.
    setupPage();
  } catch {
    window.location.href = href;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
