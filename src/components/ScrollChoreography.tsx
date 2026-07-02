import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLocation } from "react-router-dom";

type GemPose = {
  left: string;
  top: string;
  width: number;
  rotate: number;
  opacity: number;
};

const POSES: GemPose[] = [
  { left: "76vw", top: "53vh", width: 500, rotate: 0, opacity: 1 },
  { left: "88vw", top: "54vh", width: 300, rotate: -22, opacity: .92 },
  { left: "8vw", top: "46vh", width: 155, rotate: 0, opacity: .7 },
  { left: "88vw", top: "52vh", width: 270, rotate: 20, opacity: .9 },
  { left: "8vw", top: "48vh", width: 220, rotate: -18, opacity: .82 },
  { left: "84vw", top: "48vh", width: 225, rotate: 18, opacity: .82 },
  { left: "50vw", top: "35vh", width: 150, rotate: 0, opacity: .8 },
  { left: "70vw", top: "15vh", width: 300, rotate: 0, opacity: .95 },
];

const MOBILE_POSES: GemPose[] = [
  { left: "50vw", top: "220px", width: 220, rotate: 0, opacity: .55 },
];

/**
 * Recreates the reference site's scroll choreography: sections reveal as a
 * scene, while one persistent gem travels between section-specific poses.
 */
const ScrollChoreography = () => {
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 1023px)").matches);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 1023px)");
    const onChange = () => setMobile(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    let observer: IntersectionObserver | undefined;
    const frame = requestAnimationFrame(() => {
      const sections = Array.from(document.querySelectorAll<HTMLElement>("main section"));
      sections.forEach((section) => {
        section.classList.add("scroll-scene");
      });

      if (reduce) {
        sections.forEach((section) => section.classList.add("scene-visible"));
        setReady(true);
        return;
      }

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const index = sections.indexOf(entry.target as HTMLElement);
            entry.target.classList.add("scene-visible");
            if (index >= 0) setActive(index);
          });
        },
        { rootMargin: "-28% 0px -38%", threshold: 0 },
      );
      sections.forEach((section) => observer?.observe(section));
      sections[0]?.classList.add("scene-visible");
      setReady(true);
    });

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [pathname, reduce]);

  const pose = useMemo(() => {
    const poses = mobile ? MOBILE_POSES : POSES;
    return poses[active % poses.length];
  }, [active, mobile]);

  return (
    <motion.div
      aria-hidden
      className="scroll-gem pointer-events-none fixed z-[4] -translate-x-1/2 -translate-y-1/2"
      initial={false}
      animate={{
        left: pose.left,
        top: pose.top,
        width: pose.width,
        rotate: reduce ? 0 : pose.rotate,
        opacity: ready ? (reduce ? .2 : pose.opacity) : 0,
      }}
      transition={
        reduce
          ? { duration: 0 }
          : {
              type: "spring",
              stiffness: 38,
              damping: 19,
              mass: 1.18,
              restDelta: 0.01,
              restSpeed: 0.01,
            }
      }
    >
      <motion.div
        className="absolute inset-[8%] rounded-full border border-gold/20"
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 34, repeat: Infinity, ease: "linear" }}
      />
      <motion.img
        src="/assets/obsidian-gem.webp"
        alt=""
        className="relative w-full object-contain drop-shadow-[0_0_34px_rgba(184,138,74,.36)]"
        animate={reduce ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
};

export default ScrollChoreography;
