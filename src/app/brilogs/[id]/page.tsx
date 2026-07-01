import { BrilogDetail } from "@/components/brilogs/brilog-detail";

export default async function BrilogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BrilogDetail brilogId={id} />;
}
