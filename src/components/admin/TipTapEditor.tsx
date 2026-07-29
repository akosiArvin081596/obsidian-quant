"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import CharacterCount from "@tiptap/extension-character-count";
import { useEffect, useRef, useState } from "react";
import LinkPickerModal from "@/components/admin/LinkPickerModal";
import { RemovableImage } from "@/components/admin/RemovableImage";
import { RemovableVideo } from "@/components/admin/RemovableVideo";
import { readJsonResponse } from "@/lib/readJsonResponse";

type Props = {
  initialJson: unknown;
  onChange: (payload: { json: unknown; html: string; words: number }) => void;
};

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

const Icons = {
  bold: (
    <Icon>
      <path d="M7 5h6a3.5 3.5 0 0 1 0 7H7z" />
      <path d="M7 12h7a3.5 3.5 0 0 1 0 7H7z" />
    </Icon>
  ),
  italic: (
    <Icon>
      <line x1="19" y1="5" x2="10" y2="5" />
      <line x1="14" y1="19" x2="5" y2="19" />
      <line x1="15" y1="5" x2="9" y2="19" />
    </Icon>
  ),
  underline: (
    <Icon>
      <path d="M7 5v6a5 5 0 0 0 10 0V5" />
      <line x1="5" y1="19" x2="19" y2="19" />
    </Icon>
  ),
  h2: (
    <span className="font-serif text-[13px] font-semibold leading-none tracking-tight">H2</span>
  ),
  h3: (
    <span className="font-serif text-[12px] font-semibold leading-none tracking-tight">H3</span>
  ),
  list: (
    <Icon>
      <line x1="9" y1="6" x2="20" y2="6" />
      <line x1="9" y1="12" x2="20" y2="12" />
      <line x1="9" y1="18" x2="20" y2="18" />
      <circle cx="5" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="5" cy="18" r="1" fill="currentColor" stroke="none" />
    </Icon>
  ),
  numbered: (
    <Icon>
      <line x1="10" y1="6" x2="20" y2="6" />
      <line x1="10" y1="12" x2="20" y2="12" />
      <line x1="10" y1="18" x2="20" y2="18" />
      <path d="M5 5v3h1.5" />
      <path d="M4.5 15.5c.5-.8 1.5-1 2-.4.4.5.2 1.2-.5 1.6L4.5 18H7" />
      <path d="M5 11h2l-2 2.5H7" />
    </Icon>
  ),
  quote: (
    <Icon>
      <path d="M4 10c0-3 2-5 5-5v3c-1.5 0-2 .8-2 2h2v5H4z" />
      <path d="M13 10c0-3 2-5 5-5v3c-1.5 0-2 .8-2 2h2v5h-5z" />
    </Icon>
  ),
  link: (
    <Icon>
      <path d="M10 13a5 5 0 0 0 7.54.54l1.92-1.92a5 5 0 0 0-7.07-7.07L10.8 6.1" />
      <path d="M14 11a5 5 0 0 0-7.54-.54L4.54 12.4a5 5 0 0 0 7.07 7.07l1.59-1.55" />
    </Icon>
  ),
  image: (
    <Icon>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" stroke="none" />
      <path d="m21 15-4.5-4.5L8 19" />
    </Icon>
  ),
  video: (
    <Icon>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <polygon points="10 9 16 12 10 15" fill="currentColor" stroke="none" />
    </Icon>
  ),
  alignLeft: (
    <Icon>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="15" y2="12" />
      <line x1="3" y1="18" x2="18" y2="18" />
    </Icon>
  ),
  alignCenter: (
    <Icon>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="6" y1="12" x2="18" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </Icon>
  ),
  alignRight: (
    <Icon>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="9" y1="12" x2="21" y2="12" />
      <line x1="6" y1="18" x2="21" y2="18" />
    </Icon>
  ),
  alignJustify: (
    <Icon>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </Icon>
  ),
  undo: (
    <Icon>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
    </Icon>
  ),
  redo: (
    <Icon>
      <path d="m15 14 5-5-5-5" />
      <path d="M20 9H10a6 6 0 0 0 0 12h3" />
    </Icon>
  ),
};

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-9 w-9 items-center justify-center border transition-colors disabled:opacity-40 ${
        active
          ? "border-gold/40 bg-gold/10 text-gold"
          : "border-transparent text-silver/55 hover:border-gold/20 hover:text-gold"
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span aria-hidden className="mx-1 hidden h-5 w-px bg-gold/15 sm:block" />;
}

const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const VIDEO_MIME = new Set(["video/mp4", "video/webm", "video/quicktime"]);

function mediaKind(file: File): "image" | "video" | null {
  if (IMAGE_MIME.has(file.type)) return "image";
  if (VIDEO_MIME.has(file.type)) return "video";
  return null;
}

export default function TipTapEditor({ initialJson, onChange }: Props) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"image" | "video" | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkInitial, setLinkInitial] = useState("");
  const [, setSelectionTick] = useState(0);

  // Keep a stable ref so editorProps callbacks can always call the latest version
  // without recreating the editor on every render.
  const uploadAndInsertRef = useRef<(file: File, kind: "image" | "video") => Promise<void>>();

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer" },
      }),
      RemovableImage,
      RemovableVideo,
      Placeholder.configure({ placeholder: "Tell the story…" }),
      CharacterCount,
    ],
    content: (initialJson as object) || { type: "doc", content: [{ type: "paragraph" }] },
    editorProps: {
      attributes: {
        class:
          "prose-blog min-h-[420px] max-w-none px-3 py-4 text-[1.05rem] leading-relaxed text-silver outline-none",
      },
      handlePaste(_view, event) {
        const items = Array.from(event.clipboardData?.items ?? []);
        const fileItem = items.find((i) => i.kind === "file" && (IMAGE_MIME.has(i.type) || VIDEO_MIME.has(i.type)));
        if (!fileItem) return false;
        const file = fileItem.getAsFile();
        if (!file) return false;
        const kind = mediaKind(file);
        if (!kind) return false;
        event.preventDefault();
        void uploadAndInsertRef.current?.(file, kind);
        return true;
      },
      handleDrop(_view, event) {
        const files = Array.from(event.dataTransfer?.files ?? []);
        const mediaFiles = files.filter((f) => mediaKind(f) !== null);
        if (!mediaFiles.length) return false;
        event.preventDefault();
        for (const file of mediaFiles) {
          const kind = mediaKind(file);
          if (kind) void uploadAndInsertRef.current?.(file, kind);
        }
        return true;
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange({
        json: ed.getJSON(),
        html: ed.getHTML(),
        words: ed.storage.characterCount?.words?.() ?? 0,
      });
    },
    onSelectionUpdate: () => {
      setSelectionTick((n) => n + 1);
    },
  });

  useEffect(() => {
    if (!editor) return;
    onChange({
      json: editor.getJSON(),
      html: editor.getHTML(),
      words: editor.storage.characterCount?.words?.() ?? 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount sync only
  }, [editor]);

  async function uploadAndInsert(file: File, kind: "image" | "video") {
    if (!editor) return;
    setUploading(kind);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("altText", file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
      const res = await fetch("/api/admin/media/", { method: "POST", body: form });
      const data = await readJsonResponse<{ media: { storageKey: string; altText: string | null }; error?: { message?: string } }>(res);
      if (!res.ok) {
        throw new Error(data?.error?.message || "Upload failed");
      }
      const src = `/uploads/${data.media.storageKey}`;
      const label = data.media.altText || file.name;
      if (kind === "video") {
        editor.chain().focus().setVideo({ src, title: label }).run();
      } else {
        editor.chain().focus().setImage({ src, alt: label }).run();
      }
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  }

  // Keep the ref in sync after every render so the editorProps callbacks are always fresh.
  uploadAndInsertRef.current = uploadAndInsert;

  function openLinkModal() {
    if (!editor) return;
    const existing = editor.getAttributes("link").href as string | undefined;
    setLinkInitial(existing ?? "");
    setLinkOpen(true);
  }

  if (!editor) {
    return <div className="min-h-[420px] border border-gold/10 bg-midnight/30 p-4 text-silver/40">Loading editor…</div>;
  }

  return (
    <div
      className={`border bg-midnight/30 transition-colors ${dragOver ? "border-gold/60 ring-1 ring-gold/30" : "border-gold/15"}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragEnter={() => setDragOver(true)}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false); }}
      onDrop={() => setDragOver(false)}
    >
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void uploadAndInsert(file, "image");
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void uploadAndInsert(file, "video");
        }}
      />
      <div
        role="toolbar"
        aria-label="Formatting"
        className="flex flex-wrap items-center gap-0.5 border-b border-gold/10 bg-ink/40 px-2 py-1.5"
      >
        <ToolbarButton
          label="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
        >
          {Icons.bold}
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
        >
          {Icons.italic}
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
        >
          {Icons.underline}
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          label="Heading 2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
        >
          {Icons.h2}
        </ToolbarButton>
        <ToolbarButton
          label="Heading 3"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
        >
          {Icons.h3}
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          label="Bullet list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
        >
          {Icons.list}
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
        >
          {Icons.numbered}
        </ToolbarButton>
        <ToolbarButton
          label="Quote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
        >
          {Icons.quote}
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          label="Align left"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
        >
          {Icons.alignLeft}
        </ToolbarButton>
        <ToolbarButton
          label="Align center"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
        >
          {Icons.alignCenter}
        </ToolbarButton>
        <ToolbarButton
          label="Align right"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
        >
          {Icons.alignRight}
        </ToolbarButton>
        <ToolbarButton
          label="Justify"
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          active={editor.isActive({ textAlign: "justify" })}
        >
          {Icons.alignJustify}
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton label="Insert link" onClick={openLinkModal} active={editor.isActive("link")}>
          {Icons.link}
        </ToolbarButton>
        <ToolbarButton
          label={uploading === "image" ? "Uploading image…" : "Insert image"}
          disabled={!!uploading}
          onClick={() => imageInputRef.current?.click()}
        >
          {Icons.image}
        </ToolbarButton>
        <ToolbarButton
          label={uploading === "video" ? "Uploading video…" : "Insert video"}
          disabled={!!uploading}
          onClick={() => videoInputRef.current?.click()}
        >
          {Icons.video}
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton label="Undo" onClick={() => editor.chain().focus().undo().run()}>
          {Icons.undo}
        </ToolbarButton>
        <ToolbarButton label="Redo" onClick={() => editor.chain().focus().redo().run()}>
          {Icons.redo}
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />

      <LinkPickerModal
        open={linkOpen}
        initialUrl={linkInitial}
        canRemove={editor.isActive("link")}
        onClose={() => setLinkOpen(false)}
        onRemove={() => {
          editor.chain().focus().extendMarkRange("link").unsetLink().run();
          setLinkOpen(false);
        }}
        onApply={(href, openInNewTab) => {
          editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({
              href,
              target: openInNewTab ? "_blank" : null,
              rel: openInNewTab ? "noopener noreferrer" : null,
            })
            .run();
          setLinkOpen(false);
        }}
      />
    </div>
  );
}
