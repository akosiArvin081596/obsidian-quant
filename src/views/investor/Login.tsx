"use client";

import { memo, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Logo from "../../components/Logo";
import GoldRule from "../../components/GoldRule";
import { EASE_LUX } from "../../lib/motion";
import { useSession } from "./session-context";

type Status = "idle" | "auth";

const inputClass =
  "w-full rounded-none border border-gold/20 bg-obsidian/60 px-4 py-3 text-sm text-ghost placeholder:text-silver/30 transition-colors focus:border-gold focus:outline-none font-mono";
const labelClass =
  "mb-1.5 block text-[0.6rem] font-medium uppercase tracking-[0.22em] text-silver/55";

/**
 * Investor sign-in — MOCKUP. Accepts any Member ID + Access Key, plays a
 * brief "establishing session" beat, then enters the member area. No backend.
 */
const Login = () => {
  const router = useRouter();
  const { signIn } = useSession();
  const [status, setStatus] = useState<Status>("idle");
  const [memberId, setMemberId] = useState("");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "auth") return;
    setStatus("auth");
    timer.current = window.setTimeout(() => {
      signIn(memberId.trim());
      router.push("/investor/dashboard");
    }, 1400);
  };

  return (
    <motion.div
      className="relative w-full max-w-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE_LUX }}
    >
      {/* soft gold bloom behind the gateway card */}
      <div
        aria-hidden
        className="gold-bloom pointer-events-none absolute left-1/2 top-1/2 z-[-1] h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2"
      />
      <div className="border border-gold/20 bg-midnight/60 p-8 backdrop-blur-md gold-grid lg:p-10">
        <div className="text-center">
          <div className="mb-7 flex justify-center">
            <Logo size={44} withWordmark={false} />
          </div>
          <div className="eyebrow justify-center">Member Access</div>
          <h1 className="mt-4 font-serif text-3xl text-ghost">Investor Sign-In</h1>
          <p className="mx-auto mt-3 max-w-xs text-xs font-light leading-relaxed text-silver/55">
            Authenticate with your member credentials to enter the private
            investor area.
          </p>
        </div>

        <form className="mt-7 space-y-4" onSubmit={onSubmit} aria-busy={status === "auth"}>
          <div>
            <label className={labelClass} htmlFor="member-id">
              Member ID
            </label>
            <input
              id="member-id"
              type="text"
              required
              placeholder="OQG-•••-••••"
              autoComplete="username"
              className={inputClass}
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              disabled={status === "auth"}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="access-key">
              Access Key
            </label>
            <input
              id="access-key"
              type="password"
              required
              placeholder="••••••••••••"
              autoComplete="current-password"
              className={inputClass}
              disabled={status === "auth"}
            />
          </div>

          <button
            type="submit"
            disabled={status === "auth"}
            className="flex w-full items-center justify-center gap-3 rounded-none bg-gold py-3.5 text-xs font-semibold uppercase tracking-[0.22em] text-obsidian transition-colors hover:bg-warm-gold disabled:opacity-70"
          >
            {status === "auth" ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border border-obsidian border-t-transparent" />
                Establishing session…
              </>
            ) : (
              "Enter Member Area"
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-[0.6rem] font-light uppercase tracking-[0.18em] text-silver/35">
          Demonstration environment — any credentials are accepted
        </p>

        <GoldRule className="mt-6" />

        <div className="mt-5 text-center">
          <span className="text-[0.66rem] text-silver/45">
            Membership provisioned by mandate only.
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default memo(Login);
