"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Edit3 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/ui/shell";
import { phpRequest, type PhpBrilog, type PhpCatalog, type PhpCatalogProduct, type PhpProduct } from "@/lib/php-api";

type ViewItem = {
  id: number;
  title: string;
  description: string;
  price: number;
  image_url?: string;
  href: string;
  fallback?: string;
};

export function CatalogView({ slug }: { slug: string }) {
  const [title, setTitle] = useState("Catalog");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<ViewItem[]>([]);

  useEffect(() => {
    if (slug === "brilogs") {
      phpRequest<{ brilogs: PhpBrilog[] }>("/brilogs/list.php").then((data) => {
        setTitle("3D Brilog Catalog");
        setDescription("All 3D brilog products, custom figures, NFC profile items, and premium collectible outputs.");
        setItems(data.brilogs.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          price: item.price,
          image_url: item.image_url || "/dashboard/brilog.png",
          href: `/brilogs/${item.id}`,
        })));
      }).catch(() => setItems([]));
      return;
    }
    if (slug === "cards") {
      phpRequest<{ products: PhpProduct[] }>("/products/list.php").then((data) => {
        setTitle("Printed Card Catalog");
        setDescription("All printed card products and ready-to-order card categories.");
        setItems(data.products.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          price: item.price,
          image_url: item.image_url,
          fallback: "linear-gradient(135deg, #0f172a 0%, #0f766e 56%, #e2e8f0 56%)",
          href: `/products/${item.id}`,
        })));
      }).catch(() => setItems([]));
      return;
    }
    phpRequest<{ catalog: PhpCatalog }>(`/catalogs/get.php?slug=${encodeURIComponent(slug)}`).then((data) => {
      setTitle(data.catalog.title);
      setDescription(data.catalog.description);
      setItems((data.catalog.products ?? []).map((item: PhpCatalogProduct) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        price: item.price,
        image_url: item.image_url,
        href: `/catalog/${data.catalog.slug}/${item.id}`,
      })));
    }).catch(() => setItems([]));
  }, [slug]);

  return (
    <main className="min-h-screen bg-[#eef0f4] text-slate-950">
      <header className="border-b border-slate-200 bg-white/85 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <AppLogo />
          <Button asChild variant="secondary"><Link href="/"><ArrowLeft className="h-4 w-4" /> Back</Link></Button>
        </div>
      </header>
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_76%_18%,rgba(20,184,166,0.2),transparent_32%),radial-gradient(circle_at_20%_82%,rgba(59,130,246,0.14),transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eef0f4_100%)]" />
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10">
          <div className="relative min-h-[260px] py-8">
            <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-teal-300/25 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-24 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl" />
            <div className="pointer-events-none absolute right-20 top-16 hidden h-36 w-52 rotate-12 rounded-[34px] bg-gradient-to-br from-teal-200 via-white to-blue-200 shadow-2xl shadow-teal-200/60 md:block" />
            <div className="relative z-10 max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-600">Full catalog</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-6xl">{title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{description}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-2 xl:grid-cols-4">
            {items.map((item, index) => (
              <motion.article key={item.href} className="group overflow-hidden rounded-[28px] bg-white shadow-xl shadow-slate-300/45 ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-2xl" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                <Link href={item.href} className="block">
                  <div className="relative h-32 sm:h-64">
                    {item.image_url ? (
                      <Image src={item.image_url} alt={item.title} fill sizes="(min-width: 1024px) 25vw, 90vw" className="object-contain p-3 drop-shadow-xl transition duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="h-full" style={{ backgroundImage: item.fallback ?? "linear-gradient(135deg,#ecfeff,#ffffff,#dbeafe)" }} />
                    )}
                  </div>
                  <div className="grid gap-3 p-5">
                    <h2 className="text-xl font-semibold">{item.title}</h2>
                    <p className="min-h-16 text-sm leading-6 text-slate-500">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{item.price} KZT</span>
                      <span className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white">View</span>
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
            {slug === "cards" && (
              <Link href="/designer/new" className="flex min-h-[410px] flex-col items-center justify-center rounded-[28px] bg-white text-center shadow-xl shadow-slate-300/45 ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-2xl">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500 text-white"><Edit3 className="h-7 w-7" /></span>
                <h2 className="mt-5 text-xl font-semibold">Design Your Own</h2>
                <p className="mt-2 max-w-56 text-sm text-slate-500">Open the editor and create a custom card.</p>
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
