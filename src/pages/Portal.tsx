import { memo, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PORTAL } from "../content/site";
import { EASE_LUX } from "../lib/motion";
import { cn } from "../lib/cn";

type Status = "idle" | "auth" | "denied";

const inputClass =
  "w-full rounded-none border border-gold/20 bg-obsidian/60 px-4 py-3 text-sm text-ghost placeholder:text-silver/30 transition-colors focus:border-gold focus:outline-none font-mono";

const Portal = () => {
  const [status, setStatus] = useState<Status>("idle");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("auth");
    timer.current = window.setTimeout(() => setStatus("denied"), 1700);
  };

  return (
    <motion.div
      className="w-full max-w-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE_LUX }}
    >
      <div className="border border-gold/20 bg-midnight/60 p-8 backdrop-blur-md gold-grid lg:p-10">
        <div className="text-center">
          <div className="eyebrow justify-center">{PORTAL.eyebrow}</div>
          <h1 className="mt-4 font-serif text-3xl text-ghost">{PORTAL.title}</h1>
          <p className="mx-auto mt-3 max-w-xs text-xs font-light leading-relaxed text-silver/55">
            {PORTAL.body}
          </p>
        </div>

        {/* system readout */}
        <div className="mt-7 space-y-2 border-y border-silver/10 py-4 font-mono text-[10px] uppercase tracking-wider text-silver/45">
          <div className="flex justify-between">
            <span>System</span>
            <span className="text-gold">{PORTAL.systemCode}</span>
          </div>
          <div className="flex justify-between">
            <span>Encryption</span>
            <span className="text-graph">AES-256 / ACTIVE</span>
          </div>
          <div className="flex justify-between">
            <span>Node</span>
            <span className="text-ghost">CH-ZRH-01</span>
          </div>
        </div>

        <form className="mt-7 space-y-4" onSubmit={onSubmit}>
          <input
            type="text"
            required
            placeholder="OPERATOR ID"
            autoComplete="username"
            className={inputClass}
            disabled={status === "auth"}
          />
          <input
            type="password"
            required
            placeholder="ACCESS KEY"
            autoComplete="current-password"
            className={inputClass}
            disabled={status === "auth"}
          />

          <button
            type="submit"
            disabled={status === "auth"}
            className={cn(
              "flex w-full items-center justify-center gap-3 rounded-none bg-gold py-3.5 text-xs font-semibold uppercase tracking-[0.22em] text-obsidian transition-colors hover:bg-warm-gold disabled:opacity-70",
            )}
          >
            {status === "auth" ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border border-obsidian border-t-transparent" />
                Establishing session…
              </>
            ) : (
              "Initialize Session"
            )}
          </button>
        </form>

        {status === "denied" && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 border border-loss/30 bg-loss/5 px-4 py-3 text-center"
          >
            <p className="font-mono text-[0.66rem] uppercase tracking-wider text-loss">
              Credentials not recognized
            </p>
            <p className="mt-1 text-[0.66rem] text-silver/55">
              Access to the DOX terminal is provisioned by mandate only.
            </p>
          </motion.div>
        )}

        <div className="mt-7 border-t border-gold/10 pt-6 text-center">
          <Link
            to="/access"
            className="text-[0.66rem] uppercase tracking-[0.22em] text-gold transition-colors hover:text-warm-gold"
          >
            Request terminal access →
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default memo(Portal);
