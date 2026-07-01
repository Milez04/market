"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, MessageCircle, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/ui/shell";
import { getStoredUser, phpRequest, type PhpProduct } from "@/lib/php-api";

const cardFallbacks = [
  "linear-gradient(135deg, #0f172a 0%, #0f766e 56%, #e2e8f0 56%)",
  "linear-gradient(135deg, #fff7ed 0%, #f4b8a9 48%, #ffffff 48%)",
];

type ProductImage = {
  title: string;
  src?: string;
  fallback: string;
};

export function ProductDetail({ productId }: { productId: string }) {
  const [product, setProduct] = useState<PhpProduct | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    phpRequest<{ product: PhpProduct }>(`/products/get.php?id=${encodeURIComponent(productId)}`)
      .then((data) => {
        setProduct(data.product);
        setActiveIndex(0);
      })
      .catch(() => setProduct(null));
  }, [productId]);

  const images = useMemo<ProductImage[]>(() => {
    if (!product) return [];
    return [
      {
        title: "Front side",
        src: product.front_image_url || product.image_url,
        fallback: cardFallbacks[0],
      },
      {
        title: "Back side",
        src: product.back_image_url,
        fallback: cardFallbacks[1],
      },
    ];
  }, [product]);

  function go(direction: -1 | 1) {
    setActiveIndex((current) => (current + direction + images.length) % images.length);
  }

  function orderProduct() {
    if (!product) return;
    const user = getStoredUser();
    const text = [
      "Здравствуйте! Я хочу оформить заказ на печать карт через CardForge 3D.",
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
          <Button asChild variant="secondary">
            <Link href="/"><ArrowLeft className="h-4 w-4" /> Back</Link>
          </Button>
        </div>
      </header>

      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_22%,rgba(20,184,166,0.18),transparent_34%),radial-gradient(circle_at_18%_82%,rgba(59,130,246,0.12),transparent_36%)]" />
        {!product && (
          <div className="mx-auto max-w-7xl px-5 py-10">
            <p className="rounded-[28px] bg-white p-8 font-semibold shadow-xl shadow-slate-300">Product not found.</p>
          </div>
        )}
        {product && images.length > 0 && (
          <div className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-10 px-5 py-8 lg:grid-cols-[0.78fr_1.22fr]">
            <div className="relative z-10">
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-teal-600">
                <ShoppingBag className="h-4 w-4" /> Printed card order
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">{product.title}</h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">{product.description}</p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-slate-950 px-5 py-3 text-lg font-bold text-white">{product.price} KZT</span>
                <Button variant="accent" onClick={orderProduct}>
                  <MessageCircle className="h-4 w-4" /> Order on WhatsApp
                </Button>
              </div>
            </div>

            <div className="relative min-h-[620px]">
              <div className="absolute inset-x-8 bottom-28 h-20 rounded-full bg-slate-900/15 blur-2xl" />
              <button
                className="absolute left-0 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-xl backdrop-blur transition hover:bg-white"
                onClick={() => go(-1)}
                aria-label="Previous card side"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                className="absolute right-0 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-xl backdrop-blur transition hover:bg-white"
                onClick={() => go(1)}
                aria-label="Next card side"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="relative flex h-[520px] items-center justify-center">
                {images[activeIndex].src ? (
                  <Image
                    key={images[activeIndex].src}
                    src={images[activeIndex].src}
                    alt={`${product.title} ${images[activeIndex].title}`}
                    fill
                    priority
                    sizes="(min-width: 1024px) 58vw, 90vw"
                    className="object-contain drop-shadow-2xl"
                  />
                ) : (
                  <div
                    className="aspect-[1.78] w-[min(100%,760px)] rounded-[34px] shadow-2xl shadow-slate-300 ring-1 ring-white"
                    style={{ backgroundImage: images[activeIndex].fallback }}
                  />
                )}
              </div>
              <div className="mx-auto mt-4 flex max-w-lg gap-3 overflow-x-auto rounded-full bg-white/70 p-2 shadow-xl shadow-slate-300/70 backdrop-blur">
                {images.map((image, index) => (
                  <button
                    key={image.title}
                    className={`relative h-16 min-w-28 overflow-hidden rounded-full border-2 transition ${
                      activeIndex === index ? "border-teal-500 ring-4 ring-teal-100" : "border-white"
                    }`}
                    onClick={() => setActiveIndex(index)}
                    aria-label={`Open ${image.title}`}
                  >
                    {image.src ? (
                      <Image src={image.src} alt="" fill sizes="112px" className="object-cover" />
                    ) : (
                      <span className="block h-full w-full" style={{ backgroundImage: image.fallback }} />
                    )}
                    <span className="absolute inset-x-0 bottom-0 bg-slate-950/70 px-2 py-0.5 text-[10px] font-semibold text-white">
                      {image.title}
                    </span>
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
