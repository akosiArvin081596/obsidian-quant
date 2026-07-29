"use client";

import Image from "@tiptap/extension-image";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";

function RemovableImageView({ node, deleteNode, selected }: NodeViewProps) {
  const src = String(node.attrs.src ?? "");
  const alt = String(node.attrs.alt ?? "");
  const title = node.attrs.title ? String(node.attrs.title) : undefined;

  return (
    <NodeViewWrapper
      as="div"
      className={`blog-editor-image group relative my-4 block w-fit max-w-[16rem] ${
        selected ? "is-selected" : ""
      }`}
      data-drag-handle
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        title={title}
        className="blog-content-image block h-auto max-h-48 max-w-[16rem] object-cover"
        draggable={false}
      />
      <button
        type="button"
        contentEditable={false}
        aria-label="Remove image"
        title="Remove image"
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

export const RemovableImage = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(RemovableImageView);
  },
}).configure({
  allowBase64: false,
  inline: false,
  HTMLAttributes: {
    class: "blog-content-image",
  },
});
