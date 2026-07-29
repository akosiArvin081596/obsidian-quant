"use client";

import { useEffect, useId, useRef, useState } from "react";

type Props = {
  status: string;
  scheduledAt?: string | null;
  canPublish: boolean;
  busy?: boolean;
  onPublishNow: () => void | Promise<void>;
  onSchedule: (iso: string) => void | Promise<void>;
  onSubmitReview: () => void | Promise<void>;
  onUnschedule?: () => void | Promise<void>;
  onUnpublish?: () => void | Promise<void>;
};

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultScheduleValue() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  if (d.getTime() <= Date.now()) d.setHours(d.getHours() + 1);
  return toLocalInputValue(d);
}

export default function PublishMenu({
  status,
  scheduledAt,
  canPublish,
  busy = false,
  onPublishNow,
  onSchedule,
  onSubmitReview,
  onUnschedule,
  onUnpublish,
}: Props) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"menu" | "schedule">("menu");
  const [when, setWhen] = useState(defaultScheduleValue);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setMode("menu");
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setMode("menu");
      }
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (status === "published") {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => void onUnpublish?.()}
        className="min-h-10 border border-silver/20 px-4 text-[.65rem] uppercase tracking-[.14em] text-silver/70 disabled:opacity-50"
      >
        Unpublish
      </button>
    );
  }

  if (status === "scheduled" && canPublish) {
    return (
      <div ref={rootRef} className="relative flex flex-wrap items-center gap-2">
        <span className="text-[.65rem] uppercase tracking-[.12em] text-gold/80">
          Scheduled
          {scheduledAt
            ? ` · ${new Date(scheduledAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}`
            : ""}
        </span>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setWhen(
              scheduledAt ? toLocalInputValue(new Date(scheduledAt)) : defaultScheduleValue(),
            );
            setMode("schedule");
            setOpen(true);
          }}
          className="min-h-10 border border-gold/30 px-3 text-[.65rem] uppercase tracking-[.14em] text-gold disabled:opacity-50"
        >
          Reschedule
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void onPublishNow()}
          className="min-h-10 bg-gold px-4 text-[.65rem] uppercase tracking-[.14em] text-obsidian disabled:opacity-50"
        >
          Publish now
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void onUnschedule?.()}
          className="min-h-10 border border-silver/20 px-3 text-[.65rem] uppercase tracking-[.14em] text-silver/60 disabled:opacity-50"
        >
          Cancel
        </button>
        {open && mode === "schedule" ? (
          <div className="absolute right-0 top-full z-30 mt-1 w-72 border border-gold/20 bg-ink p-4 shadow-[0_16px_48px_rgba(0,0,0,0.45)]">
            <ScheduleForm
              when={when}
              setWhen={setWhen}
              busy={busy}
              onCancel={() => {
                setOpen(false);
                setMode("menu");
              }}
              onConfirm={async () => {
                await onSchedule(new Date(when).toISOString());
                setOpen(false);
                setMode("menu");
              }}
            />
          </div>
        ) : null}
      </div>
    );
  }

  if (!canPublish) {
    return (
      <button
        type="button"
        disabled={busy || status === "pending_review"}
        onClick={() => void onSubmitReview()}
        className="min-h-10 bg-gold px-4 text-[.65rem] uppercase tracking-[.14em] text-obsidian disabled:opacity-50"
      >
        {status === "pending_review" ? "Pending review" : "Submit for review"}
      </button>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="flex">
        <button
          type="button"
          disabled={busy}
          onClick={() => void onPublishNow()}
          className="min-h-10 bg-gold px-4 text-[.65rem] uppercase tracking-[.14em] text-obsidian disabled:opacity-50"
        >
          Publish
        </button>
        <button
          type="button"
          disabled={busy}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          title="More publish options"
          onClick={() => {
            setOpen((v) => !v);
            setMode("menu");
            setWhen(defaultScheduleValue());
          }}
          className="min-h-10 border-l border-obsidian/20 bg-gold px-2.5 text-obsidian disabled:opacity-50"
        >
          <span className="sr-only">Open publish menu</span>
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
            <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-30 mt-1 w-72 border border-gold/20 bg-ink shadow-[0_16px_48px_rgba(0,0,0,0.45)]"
        >
          {mode === "menu" ? (
            <div className="py-1">
              <button
                type="button"
                role="menuitem"
                className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left hover:bg-gold/5"
                onClick={async () => {
                  setOpen(false);
                  await onPublishNow();
                }}
              >
                <span className="text-[.7rem] uppercase tracking-[.16em] text-gold">Publish now</span>
                <span className="text-xs text-silver/50">Go live on the public blog immediately.</span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left hover:bg-gold/5"
                onClick={() => setMode("schedule")}
              >
                <span className="text-[.7rem] uppercase tracking-[.16em] text-gold">
                  Schedule for later
                </span>
                <span className="text-xs text-silver/50">Pick a date and time to publish automatically.</span>
              </button>
              {status !== "pending_review" ? (
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full flex-col items-start gap-0.5 border-t border-gold/10 px-4 py-3 text-left hover:bg-gold/5"
                  onClick={async () => {
                    setOpen(false);
                    await onSubmitReview();
                  }}
                >
                  <span className="text-[.7rem] uppercase tracking-[.16em] text-gold">
                    Submit for review
                  </span>
                  <span className="text-xs text-silver/50">Mark as pending editorial approval.</span>
                </button>
              ) : null}
            </div>
          ) : (
            <div className="p-4">
              <ScheduleForm
                when={when}
                setWhen={setWhen}
                busy={busy}
                onCancel={() => setMode("menu")}
                onConfirm={async () => {
                  await onSchedule(new Date(when).toISOString());
                  setOpen(false);
                  setMode("menu");
                }}
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ScheduleForm({
  when,
  setWhen,
  busy,
  onCancel,
  onConfirm,
}: {
  when: string;
  setWhen: (v: string) => void;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  const [minWhen] = useState(() => toLocalInputValue(new Date(Date.now() + 60_000)));

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[.62rem] uppercase tracking-[.18em] text-gold">Schedule for later</p>
        <p className="mt-1 text-xs text-silver/50">Uses your local timezone.</p>
      </div>
      <label className="block space-y-1.5">
        <span className="text-[.62rem] uppercase tracking-[.16em] text-silver/45">Date &amp; time</span>
        <input
          type="datetime-local"
          value={when}
          min={minWhen}
          onChange={(e) => setWhen(e.target.value)}
          className="w-full border border-gold/20 bg-midnight/60 px-3 py-2.5 text-sm text-silver outline-none focus:border-gold/45"
        />
      </label>
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-9 px-3 text-[.62rem] uppercase tracking-[.14em] text-silver/55 hover:text-gold"
        >
          Back
        </button>
        <button
          type="button"
          disabled={busy || !when}
          onClick={() => void onConfirm()}
          className="min-h-9 bg-gold px-3 text-[.62rem] uppercase tracking-[.14em] text-obsidian disabled:opacity-50"
        >
          Confirm schedule
        </button>
      </div>
    </div>
  );
}
