import { permanentRedirect } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export default async function BlogCategoryRedirect({ params }: Props) {
  const { slug } = await params;
  permanentRedirect(`/insights/category/${slug}/`);
}
