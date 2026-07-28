import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "p",
  "br",
  "hr",
  "h2",
  "h3",
  "h4",
  "blockquote",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "u",
  "s",
  "code",
  "pre",
  "a",
  "img",
  "video",
  "source",
  "figure",
  "figcaption",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "span",
  "div",
  "sup",
  "sub",
];

export function sanitizeContentHtml(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      video: ["src", "controls", "preload", "poster", "title", "width", "height", "class"],
      source: ["src", "type"],
      span: ["class"],
      div: ["class"],
      code: ["class"],
      pre: ["class"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
      "*": ["class"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: (tagName, attribs) => {
        const next = { ...attribs };
        if (next.target === "_blank") {
          const rel = new Set((next.rel ?? "").split(/\s+/).filter(Boolean));
          rel.add("noopener");
          rel.add("noreferrer");
          next.rel = [...rel].join(" ");
        }
        return { tagName, attribs: next };
      },
    },
  });
}

/** Empty TipTap doc used for new drafts. */
export const EMPTY_CONTENT_JSON = {
  type: "doc",
  content: [{ type: "paragraph" }],
};
