"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    video: {
      setVideo: (attrs: { src: string; title?: string | null }) => ReturnType;
    };
  }
}

function RemovableVideoView({ node, deleteNode, selected }: NodeViewProps) {
  const src = String(node.attrs.src ?? "");
  const title = node.attrs.title ? String(node.attrs.title) : undefined;

  return (
    <NodeViewWrapper
      as="div"
      className={`blog-editor-video group relative my-4 block w-full max-w-xl ${
        selected ? "is-selected" : ""
      }`}
      data-drag-handle
    >
      <video
        src={src}
        title={title}
        controls
        preload="metadata"
        className="blog-content-video block w-full max-h-72 bg-obsidian object-contain"
        draggable={false}
      />
      <button
        type="button"
        contentEditable={false}
        aria-label="Remove video"
        title="Remove video"
        className="blog-media-remove absolute top-1.5 right-1.5 z-10 flex h-6 w-6 items-center justify-center border border-gold/30 bg-obsidian/90 text-sm leading-none text-silver hover:border-loss/50 hover:text-loss"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          deleteNode();
        }}
      >
        ×
      </button>
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
      src: { default: null },
      title: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: "video[src]",
        getAttrs: (el) => {
          if (!(el instanceof HTMLElement)) return false;
          return {
            src: el.getAttribute("src"),
            title: el.getAttribute("title"),
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
        preload: "metadata",
        class: "blog-content-video",
      }),
    ];
  },

  addCommands() {
    return {
      setVideo:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs,
          }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(RemovableVideoView);
  },
});
