"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/ui/shell";
import { getStoredUser, phpRequest, type PhpCatalogProduct } from "@/lib/php-api";

export function CatalogProductDetail({ slug, productId }: { slug: string; productId: string }) {
  const [product, setProduct] = useState<PhpCatalogProduct | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    phpRequest<{ product: PhpCatalogProduct }>(`/catalogs/product.php?id=${encodeURIComponent(productId)}`)
      .then((data) => {
        setProduct(data.product);
        setActiveIndex(0);
      })
      .catch(() => setProduct(null));
  }, [productId]);

  const images = useMemo(() => {
    const loaded = product?.images?.map((image) => image.image_url).filter(Boolean) ?? [];
    return loaded.length > 0 ? loaded : [""];
  }, [product]);

  function go(direction: -1 | 1) {
    setActiveIndex((current) => (current + direction + images.length) % images.length);
  }

  function orderProduct() {
    if (!product) return;
    const user = getStoredUser();
    const text = [
      "Здравствуйте! Я хочу оформить заказ через CardForge 3D.",
      `Каталог: ${product.catalog_title ?? slug}`,
      `Товар: ${product.title}`,
      `Цена: ${product.price} KZT`,
      user ? `Клиент: ${user.name} (${user.email})` : "Клиент: гость",
    ].join("\n");
    window.open(`https://wa.me/77022648901?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="min-h-screen bg-[#eef0f4] text-slate-950">
      <header className="border-b border-slate-200 bg-white/85 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <AppLogo />
          <Button asChild variant="secondary"><Link href={`/catalog/${slug}`}><ArrowLeft className="h-4 w-4" /> Back</Link></Button>
        </div>
      </header>
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_22%,rgba(20,184,166,0.18),transparent_34%),radial-gradient(circle_at_18%_82%,rgba(59,130,246,0.12),transparent_36%)]" />
        {!product && <div className="mx-auto max-w-7xl px-5 py-10"><p className="rounded-[28px] bg-white p-8 font-semibold shadow-xl shadow-slate-300">Product not found.</p></div>}
        {product && (
          <div className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-10 px-5 py-8 lg:grid-cols-[0.78fr_1.22fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-600">{product.catalog_title ?? "Catalog product"}</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">{product.title}</h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">{product.description}</p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-slate-950 px-5 py-3 text-lg font-bold text-white">{product.price} KZT</span>
                <Button variant="accent" onClick={orderProduct}><MessageCircle className="h-4 w-4" /> Order on WhatsApp</Button>
              </div>
            </div>
            <div className="relative min-h-[620px]">
              <div className="absolute inset-x-8 bottom-24 h-20 rounded-full bg-slate-900/15 blur-2xl" />
              <button className="absolute left-0 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-xl backdrop-blur transition hover:bg-white" onClick={() => go(-1)} aria-label="Previous photo"><ChevronLeft className="h-5 w-5" /></button>
              <button className="absolute right-0 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-xl backdrop-blur transition hover:bg-white" onClick={() => go(1)} aria-label="Next photo"><ChevronRight className="h-5 w-5" /></button>
              <div className="relative flex h-[520px] items-center justify-center">
                {images[activeIndex] ? (
                  <Image src={images[activeIndex]} alt={product.title} fill priority sizes="(min-width: 1024px) 58vw, 90vw" className="object-contain drop-shadow-2xl" />
                ) : (
                  <div className="h-96 w-96 rounded-[34px] bg-gradient-to-br from-slate-950 via-teal-700 to-slate-100 shadow-2xl shadow-slate-300" />
                )}
              </div>
              <div className="mx-auto mt-4 flex max-w-xl gap-3 overflow-x-auto rounded-full bg-white/70 p-2 shadow-xl shadow-slate-300/70 backdrop-blur">
                {images.map((image, index) => (
                  <button key={`${image}-${index}`} className={`relative h-16 min-w-16 overflow-hidden rounded-full border-2 transition ${activeIndex === index ? "border-teal-500 ring-4 ring-teal-100" : "border-white"}`} onClick={() => setActiveIndex(index)} aria-label={`Open photo ${index + 1}`}>
                    {image ? <Image src={image} alt="" fill sizes="64px" className="object-cover" /> : <span className="block h-full w-full bg-slate-200" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
