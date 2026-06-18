import { memo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { EASE_LUX } from "../lib/motion";

const inputClass =
  "w-full rounded-none border border-gold/20 bg-obsidian/60 px-4 py-3 text-sm text-ghost placeholder:text-silver/30 transition-colors focus:border-gold focus:outline-none";
const labelClass =
  "mb-1.5 block text-[0.6rem] font-medium uppercase tracking-[0.22em] text-silver/55";

const Access = () => {
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <motion.div
      className="w-full max-w-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE_LUX }}
    >
      <div className="border border-gold/20 bg-midnight/60 p-8 backdrop-blur-md gold-grid lg:p-10">
        {submitted ? (
          <div className="flex min-h-[24rem] flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center border border-graph/50 text-graph">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 13l4 4L19 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="mt-6 font-serif text-2xl text-ghost">Request received.</h2>
            <p className="mt-3 max-w-xs text-sm font-light text-silver/60">
              Our committee reviews provisioning requests on a limited-capacity
              basis. Qualified counterparties will be contacted to complete
              verification.
            </p>
            <Link
              to="/portal"
              className="mt-7 text-[0.66rem] uppercase tracking-[0.22em] text-gold hover:text-warm-gold"
            >
              ← Return to gateway
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center">
              <div className="eyebrow justify-center">Provision Access</div>
              <h1 className="mt-4 font-serif text-3xl text-ghost">
                Request Terminal Access
              </h1>
              <p className="mx-auto mt-3 max-w-xs text-xs font-light leading-relaxed text-silver/55">
                Submit your institutional details to begin DOX provisioning.
                All requests are manually vetted.
              </p>
            </div>

            <form className="mt-7 space-y-4" onSubmit={onSubmit} noValidate>
              <div>
                <label className={labelClass} htmlFor="name">
                  Authorised Representative
                </label>
                <input id="name" type="text" required className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="entity">
                  Institutional Entity
                </label>
                <input id="entity" type="text" required className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="email">
                  Corporate Email
                </label>
                <input id="email" type="email" required className={inputClass} />
              </div>

              <button
                type="submit"
                className="w-full rounded-none bg-gold py-3.5 text-xs font-semibold uppercase tracking-[0.22em] text-obsidian transition-colors hover:bg-warm-gold"
              >
                Submit Request
              </button>
            </form>

            <div className="mt-6 border-t border-gold/10 pt-5 text-center">
              <Link
                to="/portal"
                className="text-[0.66rem] uppercase tracking-[0.22em] text-silver/55 hover:text-gold"
              >
                ← Return to gateway
              </Link>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default memo(Access);
