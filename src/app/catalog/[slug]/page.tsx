import { CatalogView } from "@/components/catalog/catalog-view";

export default async function CatalogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CatalogView slug={slug} />;
}
