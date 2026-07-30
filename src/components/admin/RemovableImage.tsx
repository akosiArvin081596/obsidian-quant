"use client";

import Image from "@tiptap/extension-image";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";

// ── Types ─────────────────────────────────────────────────────────────────────
type Layout = "inline" | "left" | "right" | "center" | "full";
type ImgSize = "sm" | "md" | "lg";

// ── Layout → CSS class on the wrapper ────────────────────────────────────────
const LAYOUT_WRAPPER_CLASS: Record<Layout, string> = {
  inline:  "",
  left:    "blog-img-left",
  right:   "blog-img-right",
  center:  "blog-img-center",
  full:    "blog-img-full",
};

// ── Size → CSS class on the wrapper ──────────────────────────────────────────
const SIZE_CLASS: Record<ImgSize, string> = {
  sm: "blog-img-sm",
  md: "blog-img-md",
  lg: "blog-img-lg",
};

// ── Icons (inline SVG, 14×14) ─────────────────────────────────────────────────

const ICONS = {
  inline: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" aria-hidden><title>Inline with text</title>
      <rect x="3" y="4" width="8" height="7" rx="1" />
      <line x1="13" y1="6" x2="21" y2="6" />
      <line x1="13" y1="10" x2="21" y2="10" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="3" y1="19" x2="21" y2="19" />
    </svg>
  ),
  left: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" aria-hidden><title>Float left</title>
      <rect x="2" y="4" width="9" height="9" rx="1" />
      <line x1="13" y1="6" x2="22" y2="6" />
      <line x1="13" y1="10" x2="22" y2="10" />
      <line x1="2" y1="16" x2="22" y2="16" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  ),
  right: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" aria-hidden><title>Float right</title>
      <rect x="13" y="4" width="9" height="9" rx="1" />
      <line x1="2" y1="6" x2="11" y2="6" />
      <line x1="2" y1="10" x2="11" y2="10" />
      <line x1="2" y1="16" x2="22" y2="16" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  ),
  center: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" aria-hidden><title>Center (top and bottom)</title>
      <rect x="7" y="4" width="10" height="9" rx="1" />
      <line x1="2" y1="16" x2="22" y2="16" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  ),
  full: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" aria-hidden><title>Full width</title>
      <rect x="2" y="5" width="20" height="10" rx="1" />
      <line x1="2" y1="19" x2="22" y2="19" />
    </svg>
  ),
};

// ── Node view ─────────────────────────────────────────────────────────────────
function RemovableImageView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const src    = String(node.attrs.src ?? "");
  const alt    = String(node.attrs.alt ?? "");
  const title  = node.attrs.title ? String(node.attrs.title) : undefined;
  const layout = (node.attrs.layout as Layout)  ?? "center";
  const size   = (node.attrs.size   as ImgSize) ?? "md";

  const layoutClass = LAYOUT_WRAPPER_CLASS[layout];
  const sizeClass   = layout === "full" ? "" : SIZE_CLASS[size];

  const layouts: { key: Layout; label: string; icon: React.ReactNode }[] = [
    { key: "inline",  label: "Inline",  icon: ICONS.inline  },
    { key: "left",    label: "Left",    icon: ICONS.left    },
    { key: "center",  label: "Center",  icon: ICONS.center  },
    { key: "right",   label: "Right",   icon: ICONS.right   },
    { key: "full",    label: "Full",    icon: ICONS.full    },
  ];

  const sizes: { key: ImgSize; label: string }[] = [
    { key: "sm", label: "S" },
    { key: "md", label: "M" },
    { key: "lg", label: "L" },
  ];

  return (
    <NodeViewWrapper
      as="div"
      data-drag-handle
      data-layout={layout}
      data-size={size}
      className={[
        "blog-editor-image group relative my-3",
        layoutClass,
        sizeClass,
        selected ? "is-selected" : "",
      ].filter(Boolean).join(" ")}
    >
      {/* ── Format toolbar ── */}
      <div className="blog-media-toolbar" contentEditable={false}>
        {/* Layout buttons */}
        {layouts.map(({ key, label, icon }) => (
          <button
            key={key}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={layout === key}
            className={layout === key ? "is-active" : ""}
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateAttributes({ layout: key }); }}
          >
            {icon}
          </button>
        ))}

        {/* Separator */}
        {layout !== "full" && <span className="toolbar-sep" aria-hidden />}

        {/* Size buttons (hidden for full-width) */}
        {layout !== "full" && sizes.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            title={label === "S" ? "Small" : label === "M" ? "Medium" : "Large"}
            aria-label={label === "S" ? "Small" : label === "M" ? "Medium" : "Large"}
            aria-pressed={size === key}
            className={size === key ? "is-active" : ""}
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateAttributes({ size: key }); }}
          >
            {label}
          </button>
        ))}

        {/* Separator */}
        <span className="toolbar-sep" aria-hidden />

        {/* Remove */}
        <button
          type="button"
          aria-label="Remove image"
          title="Remove image"
          className="blog-media-remove"
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteNode(); }}
        >
          ×
        </button>
      </div>

      {/* ── Image ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} title={title} draggable={false} />
    </NodeViewWrapper>
  );
}

// ── TipTap extension ──────────────────────────────────────────────────────────
export const RemovableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      layout: {
        default: "center",
        parseHTML: (el) => (el.getAttribute("data-layout") as Layout) ?? "center",
        // Only emit data-layout on the img — CSS attr selectors handle public rendering.
        renderHTML: (attrs: Record<string, unknown>) => ({
          "data-layout": attrs.layout ?? "center",
        }),
      },
      size: {
        default: "md",
        parseHTML: (el) => (el.getAttribute("data-size") as ImgSize) ?? "md",
        renderHTML: (attrs: Record<string, unknown>) => ({
          "data-size": attrs.size ?? "md",
        }),
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(RemovableImageView);
  },
}).configure({
  allowBase64: false,
  inline: false,
  HTMLAttributes: { class: "blog-content-image" },
});
