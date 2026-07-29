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
      img: ["src", "alt", "title", "width", "height", "loading", "data-layout", "data-size"],
      video: ["src", "controls", "preload", "poster", "title", "width", "height", "class", "data-layout"],
      source: ["src", "type"],
      span: ["class"],
      div: ["class"],
      code: ["class"],
      pre: ["class"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
      "*": ["class"],
    },
    allowedClasses: {
      img: [
        "blog-content-image",
        "blog-img-left", "blog-img-right", "blog-img-center", "blog-img-full",
        "blog-img-sm", "blog-img-md", "blog-img-lg",
      ],
      video: [
        "blog-content-video",
        "blog-img-full",
      ],
      div: [
        "blog-img-left", "blog-img-right", "blog-img-center", "blog-img-full",
        "blog-img-sm", "blog-img-md", "blog-img-lg",
        "blog-img-clearfix",
      ],
    },
    allowedStyles: {
      // TipTap TextAlign writes inline style="text-align: ..." on block elements.
      // Allow only text-align (not arbitrary CSS) so alignment survives sanitization.
      p:          { "text-align": [/^(left|center|right|justify)$/] },
      h2:         { "text-align": [/^(left|center|right|justify)$/] },
      h3:         { "text-align": [/^(left|center|right|justify)$/] },
      h4:         { "text-align": [/^(left|center|right|justify)$/] },
      blockquote: { "text-align": [/^(left|center|right|justify)$/] },
      li:         { "text-align": [/^(left|center|right|justify)$/] },
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
