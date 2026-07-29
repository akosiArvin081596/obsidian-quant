import PostEditor from "@/views/admin/PostEditor";

type Props = { params: Promise<{ id: string }> };

export default async function AdminPostEditPage({ params }: Props) {
  const { id } = await params;
  return <PostEditor postId={id} />;
}
