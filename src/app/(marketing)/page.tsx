import Home from "@/views/Home";
import { pageMetadata } from "@/lib/seo";
import { BRAND, HERO } from "@/content/site";

export const metadata = pageMetadata({
  title: `${BRAND.name} | Profit from Market Dislocation`,
  description: `${HERO.sub} ${BRAND.intro}`,
  path: "/",
});

export default function HomePage() {
  return <Home />;
}
