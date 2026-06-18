import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Logo from "../components/Logo";
import { EASE_LUX } from "../lib/motion";

/** Brief obsidian curtain with the crystal mark — sets the tone on first paint. */
const Preloader = () => {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDone(true), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-obsidian"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: EASE_LUX }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: EASE_LUX }}
          >
            <Logo size={64} withWordmark={false} />
          </motion.div>
          <div className="mt-8 h-px w-40 overflow-hidden bg-gold/15">
            <motion.div
              className="h-full bg-gold"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.3, ease: EASE_LUX }}
            />
          </div>
          <p className="mt-5 text-[0.6rem] uppercase tracking-[0.4em] text-silver/40">
            Forged in Precision
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Preloader;
