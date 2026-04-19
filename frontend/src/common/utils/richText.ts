const ALLOWED_TAGS = new Set([
  "A",
  "B",
  "BR",
  "DIV",
  "EM",
  "I",
  "LI",
  "OL",
  "P",
  "SPAN",
  "STRONG",
  "U",
  "UL",
]);

function isSafeHref(href: string): boolean {
  try {
    const url = new URL(href, window.location.origin);
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function cleanNode(targetDoc: Document, node: Node): Node | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return targetDoc.createTextNode(node.textContent ?? "");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const el = node as HTMLElement;
  const tag = el.tagName.toUpperCase();

  if (!ALLOWED_TAGS.has(tag)) {
    const fragment = targetDoc.createDocumentFragment();
    for (const child of Array.from(el.childNodes)) {
      const cleaned = cleanNode(targetDoc, child);
      if (cleaned) fragment.appendChild(cleaned);
    }
    return fragment;
  }

  const out = targetDoc.createElement(tag.toLowerCase());
  if (tag === "A") {
    const href = el.getAttribute("href") ?? "";
    if (href && isSafeHref(href)) {
      out.setAttribute("href", href);
      out.setAttribute("target", "_blank");
      out.setAttribute("rel", "noreferrer noopener");
    }
  }

  for (const child of Array.from(el.childNodes)) {
    const cleaned = cleanNode(targetDoc, child);
    if (cleaned) out.appendChild(cleaned);
  }

  return out;
}

export function sanitizeRichTextHtml(input: string): string {
  if (!input) return "";

  const parser = new DOMParser();
  const parsed = parser.parseFromString(`<div>${input}</div>`, "text/html");
  const root = parsed.body.firstElementChild ?? parsed.body;
  const outputDoc = document.implementation.createHTMLDocument("");
  const container = outputDoc.createElement("div");

  for (const child of Array.from(root.childNodes)) {
    const cleaned = cleanNode(outputDoc, child);
    if (cleaned) container.appendChild(cleaned);
  }

  return container.innerHTML;
}

export function richTextToPlainText(input: string): string {
  if (!input) return "";
  const parser = new DOMParser();
  const parsed = parser.parseFromString(`<div>${input}</div>`, "text/html");
  return parsed.body.textContent ?? "";
}

export function richTextHasContent(input: string): boolean {
  return richTextToPlainText(input).trim().length > 0;
}
