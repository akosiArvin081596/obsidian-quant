import { motion, useReducedMotion } from "framer-motion";
import { cn } from "../lib/cn";

type Props = {
  className?: string;
  compact?: boolean;
};

const ObsidianGem = ({ className, compact = false }: Props) => {
  const reduce = useReducedMotion();

  return (
    <div
      className={cn(
        "obsidian-gem-stage pointer-events-none relative isolate",
        compact ? "h-64 w-52 md:h-80 md:w-64" : "h-[30rem] w-[24rem] lg:h-[42rem] lg:w-[34rem]",
        className,
      )}
      aria-hidden
    >
      <motion.div
        className="gem-orbit absolute inset-[8%] rounded-full border border-gold/20"
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="gem-orbit gem-orbit-secondary absolute inset-[18%] rounded-full border border-gold/10"
        animate={reduce ? undefined : { rotate: -360 }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
      />
      <motion.img
        src="/assets/obsidian-gem.webp"
        alt=""
        className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_0_42px_rgba(184,138,74,0.32)]"
        animate={reduce ? undefined : { y: [0, -13, 0], rotate: [-1.2, 1.2, -1.2] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="gem-ground absolute bottom-[8%] left-1/2 h-12 w-[70%] -translate-x-1/2 rounded-full" />
    </div>
  );
};

export default ObsidianGem;
