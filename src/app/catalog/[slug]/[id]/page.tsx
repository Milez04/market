import { CatalogProductDetail } from "@/components/catalog/catalog-product-detail";

export default async function CatalogProductPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  return <CatalogProductDetail slug={slug} productId={id} />;
}
