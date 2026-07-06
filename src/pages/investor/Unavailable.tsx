import { memo } from "react";
import Button from "../../components/Button";
import PageHero from "../../components/PageHero";
import Section from "../../components/Section";

const InvestorUnavailable = () => (
  <>
    <PageHero
      eyebrow="Member Access"
      title="Private access is not available online."
      body="The investor portal is not connected to a production authentication service. Institutional counterparties can request access through the firm directly."
    />
    <Section className="bg-midnight" spacing="py-16 lg:py-20">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-sm font-light leading-relaxed text-silver/60">
          No credentials are accepted or processed by this website.
        </p>
        <div className="mt-8">
          <Button to="/contact" variant="primary">Request Access</Button>
        </div>
      </div>
    </Section>
  </>
);

export default memo(InvestorUnavailable);
