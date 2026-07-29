"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    video: {
      setVideo: (attrs: { src: string; title?: string | null; layout?: string }) => ReturnType;
    };
  }
}

type VideoLayout = "center" | "full";

const LAYOUT_CLASS: Record<VideoLayout, string> = {
  center: "",
  full:   "blog-img-full",
};

function RemovableVideoView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const src    = String(node.attrs.src ?? "");
  const title  = node.attrs.title ? String(node.attrs.title) : undefined;
  const layout = (node.attrs.layout as VideoLayout) ?? "center";

  const layouts: { key: VideoLayout; label: string }[] = [
    { key: "center", label: "Center" },
    { key: "full",   label: "Full" },
  ];

  return (
    <NodeViewWrapper
      as="div"
      data-drag-handle
      className={[
        "blog-editor-video group relative my-4",
        LAYOUT_CLASS[layout],
        selected ? "is-selected" : "",
      ].filter(Boolean).join(" ")}
    >
      {/* ── Format toolbar ── */}
      <div className="blog-media-toolbar" contentEditable={false}>
        {layouts.map(({ key, label }) => (
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
            {label}
          </button>
        ))}

        <span className="toolbar-sep" aria-hidden />

        <button
          type="button"
          aria-label="Remove video"
          title="Remove video"
          className="blog-media-remove"
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteNode(); }}
        >
          ×
        </button>
      </div>

      <video
        src={src}
        title={title}
        controls
        preload="metadata"
        className="blog-content-video block w-full bg-obsidian object-contain"
        draggable={false}
      />
    </NodeViewWrapper>
  );
}

export const RemovableVideo = Node.create({
  name: "video",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src:    { default: null },
      title:  { default: null },
      layout: {
        default: "center",
        parseHTML: (el) => (el.getAttribute("data-layout") as VideoLayout) ?? "center",
        renderHTML: (attrs: Record<string, unknown>) => ({
          "data-layout": attrs.layout ?? "center",
          class: [
            "blog-content-video",
            LAYOUT_CLASS[(attrs.layout as VideoLayout) ?? "center"],
          ].filter(Boolean).join(" "),
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "video[src]",
        getAttrs: (el) => {
          if (!(el instanceof HTMLElement)) return false;
          return {
            src:    el.getAttribute("src"),
            title:  el.getAttribute("title"),
            layout: (el.getAttribute("data-layout") as VideoLayout) ?? "center",
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "video",
      mergeAttributes(HTMLAttributes, {
        controls: "true",
        preload:  "metadata",
      }),
    ];
  },

  addCommands() {
    return {
      setVideo:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(RemovableVideoView);
  },
});
