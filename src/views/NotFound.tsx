"use client";

import { memo } from "react";
import Button from "../components/Button";
import AuroraRibbon from "../components/AuroraRibbon";

const NotFound = () => (
  <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 pt-24 hex-bg gold-grid sm:px-6">
    <AuroraRibbon intensity={0.4} className="scene-behind opacity-50" />
    <div className="scene-content relative z-10 text-center">
      <div className="text-display text-7xl text-gold-gradient sm:text-8xl lg:text-9xl">404</div>
      <h1 className="mt-4 text-display text-2xl text-ghost sm:text-3xl lg:text-4xl">
        This coordinate lies outside the model.
      </h1>
      <p className="mx-auto mt-4 max-w-md text-sm font-light text-silver/60">
        The page you requested is not part of the mapped architecture.
      </p>
      <div className="mt-10">
        <Button to="/" variant="outline">
          Return to Base
        </Button>
      </div>
    </div>
  </section>
);

export default memo(NotFound);
