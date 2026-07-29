import Button from "@/components/Button";
import Eyebrow from "@/components/Eyebrow";
import Section from "@/components/Section";

type Props = {
  title?: string;
  body?: string;
  compact?: boolean;
};

export default function BlogCta({
  title = "Turn research into a mandate conversation.",
  body = "Obsidian Quant publishes systematic perspective for qualified institutional and professional investors. Request a briefing to discuss strategy fit, risk architecture, and onboarding.",
  compact = false,
}: Props) {
  return (
    <Section
      className="border-t border-gold/10 bg-obsidian hex-bg"
      spacing={compact ? "py-16 lg:py-20" : "py-24 lg:py-32"}
      inner="max-w-3xl"
    >
      <div className="text-center">
        <Eyebrow centered>Institutional Access</Eyebrow>
        <h2 className="mt-6 font-serif text-3xl text-ghost lg:text-4xl">{title}</h2>
        <p className="mx-auto mt-5 max-w-xl text-sm font-light leading-relaxed text-silver/60">{body}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button to="/contact" variant="primary">
            Request Access
          </Button>
          <Button to="/strategy" variant="outline">
            Explore Strategy
          </Button>
        </div>
      </div>
    </Section>
  );
}
