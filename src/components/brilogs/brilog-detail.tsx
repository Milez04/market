"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/ui/shell";
import { getStoredUser, phpRequest, type PhpBrilog } from "@/lib/php-api";

export function BrilogDetail({ brilogId }: { brilogId: string }) {
  const [brilog, setBrilog] = useState<PhpBrilog | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    phpRequest<{ brilog: PhpBrilog }>(`/brilogs/get.php?id=${encodeURIComponent(brilogId)}`)
      .then((data) => {
        setBrilog(data.brilog);
        setActiveIndex(0);
      })
      .catch(() => setBrilog(null));
  }, [brilogId]);

  const images = useMemo(() => {
    const loaded = brilog?.images?.map((image) => image.image_url).filter(Boolean) ?? [];
    return loaded.length > 0 ? loaded : ["/dashboard/brilog.png"];
  }, [brilog]);
  const isCustomContact = brilog?.title.toLowerCase().includes("contact") || brilog?.id === 4;

  function go(direction: -1 | 1) {
    setActiveIndex((current) => (current + direction + images.length) % images.length);
  }

  function orderBrilog() {
    if (!brilog) return;
    const user = getStoredUser();
    const text = [
      isCustomContact
        ? "Здравствуйте! Я хочу сделать персональный 3D брелок по моей фотографии через CardForge 3D."
        : "Здравствуйте! Я хочу оформить заказ на 3D брелок через CardForge 3D.",
      `Товар: ${brilog.title}`,
      `Цена: ${brilog.price} KZT`,
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
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_70%_20%,rgba(20,184,166,0.2),transparent_34%),radial-gradient(circle_at_18%_82%,rgba(59,130,246,0.14),transparent_36%)]" />
        {!brilog && (
          <div className="mx-auto max-w-7xl px-5 py-10">
            <p className="rounded-[28px] bg-white p-8 font-semibold shadow-xl shadow-slate-300">Brilog not found.</p>
          </div>
        )}
        {brilog && (
          <div className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-10 px-5 py-8 lg:grid-cols-[0.78fr_1.22fr]">
            <div className="relative z-10">
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-teal-600">
                <Sparkles className="h-4 w-4" /> 3D brilog order
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">{brilog.title}</h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">{brilog.description}</p>
              {isCustomContact && (
                <div className="mt-5 max-w-xl rounded-[24px] bg-white/75 p-5 text-sm leading-6 text-slate-700 shadow-xl shadow-slate-300/50 backdrop-blur">
                  Bize ulaşın. Fotoğrafınızı gönderin, biz size özel 3D brilog tasarımını hazırlayıp detaylar için geri döneriz.
                </div>
              )}
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-slate-950 px-5 py-3 text-lg font-bold text-white">From {brilog.price} KZT</span>
                <Button variant="accent" onClick={orderBrilog}>
                  <MessageCircle className="h-4 w-4" /> {isCustomContact ? "Contact us" : "Order on WhatsApp"}
                </Button>
              </div>
            </div>

            <div className="relative min-h-[640px]">
              <div className="absolute inset-x-12 bottom-16 h-20 rounded-full bg-slate-900/15 blur-2xl" />
              <button
                className="absolute left-0 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-xl backdrop-blur transition hover:bg-white"
                onClick={() => go(-1)}
                aria-label="Previous brilog photo"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                className="absolute right-0 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-xl backdrop-blur transition hover:bg-white"
                onClick={() => go(1)}
                aria-label="Next brilog photo"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="relative h-[560px]">
                <Image
                  key={images[activeIndex]}
                  src={images[activeIndex]}
                  alt={`${brilog.title} photo ${activeIndex + 1}`}
                  fill
                  priority
                  sizes="(min-width: 1024px) 58vw, 90vw"
                  className="object-contain drop-shadow-2xl"
                />
              </div>
              <div className="mx-auto mt-4 flex max-w-xl gap-3 overflow-x-auto rounded-full bg-white/70 p-2 shadow-xl shadow-slate-300/70 backdrop-blur">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    className={`relative h-16 min-w-16 overflow-hidden rounded-full border-2 transition ${
                      activeIndex === index ? "border-teal-500 ring-4 ring-teal-100" : "border-white"
                    }`}
                    onClick={() => setActiveIndex(index)}
                    aria-label={`Open brilog photo ${index + 1}`}
                  >
                    <Image src={image} alt="" fill sizes="64px" className="object-cover" />
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
