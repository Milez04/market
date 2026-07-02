"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronDown, Edit3, Grid3X3, LogIn, LogOut, Sparkles, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/ui/shell";
import { clearSession, getStoredUser, phpRequest, type PhpBrilog, type PhpCatalog, type PhpCatalogProduct, type PhpProduct, type PhpUser } from "@/lib/php-api";

const productFallbacks = [
  "linear-gradient(135deg, #0f172a 0%, #0f766e 56%, #e2e8f0 56%)",
  "linear-gradient(135deg, #fff7ed 0%, #f4b8a9 48%, #ffffff 48%)",
  "linear-gradient(135deg, #09090b 0%, #1f1f22 58%, #d7b46a 58%)",
  "linear-gradient(135deg, #eef6ff 0%, #2563eb 52%, #111827 52%)",
];

export function DashboardShell() {
  const [user, setUser] = useState<PhpUser | null>(null);
  const [brilogs, setBrilogs] = useState<PhpBrilog[]>([]);
  const [products, setProducts] = useState<PhpProduct[]>([]);
  const [catalogs, setCatalogs] = useState<PhpCatalog[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
    void Promise.allSettled([
      phpRequest<{ brilogs: PhpBrilog[] }>("/brilogs/list.php"),
      phpRequest<{ products: PhpProduct[] }>("/products/list.php"),
      phpRequest<{ catalogs: PhpCatalog[] }>("/catalogs/list.php"),
    ]).then(([brilogResult, productResult, catalogResult]) => {
      setBrilogs(brilogResult.status === "fulfilled" ? brilogResult.value.brilogs : []);
      setProducts(productResult.status === "fulfilled" ? productResult.value.products : []);
      setCatalogs(catalogResult.status === "fulfilled" ? catalogResult.value.catalogs : []);
    });
  }, []);

  function logout() {
    clearSession();
    window.location.href = "/";
  }

  return (
    <main className="min-h-screen bg-[#eef0f4] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 px-4 py-4 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <AppLogo />
          <div className="relative flex items-center gap-3">
            {user ? (
              <>
                <button
                  className="flex items-center gap-3 rounded-full border bg-white px-3 py-1.5 shadow-sm transition hover:shadow-md"
                  onClick={() => setProfileOpen((current) => !current)}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-white">
                    <UserRound className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold">{user.name}</span>
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                </button>
                {profileOpen && (
                  <div className="absolute right-24 top-12 z-50 w-56 rounded-2xl border bg-white p-2 shadow-2xl shadow-slate-300">
                    <Link className="block rounded-xl px-3 py-2 text-sm font-medium hover:bg-slate-100" href="/profile">Profile edit</Link>
                    <Link className="block rounded-xl px-3 py-2 text-sm font-medium hover:bg-slate-100" href="/my-cards">My cards</Link>
                  </div>
                )}
                <Button variant="secondary" onClick={logout}><LogOut className="h-4 w-4" /> Logout</Button>
              </>
            ) : (
              <Button asChild variant="accent"><Link href="/auth/login"><LogIn className="h-4 w-4" /> Login</Link></Button>
            )}
          </div>
        </div>
      </header>

      <section className="relative isolate overflow-hidden border-b border-slate-200">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_82%_34%,rgba(20,184,166,0.22),transparent_30%),radial-gradient(circle_at_24%_72%,rgba(59,130,246,0.16),transparent_34%),linear-gradient(180deg,#f8fafc_0%,#eef0f4_100%)]" />
        <motion.div
          className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-10 px-4 py-10 sm:px-8 lg:grid-cols-[0.82fr_1.18fr]"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="relative z-10 max-w-2xl py-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-600">AI 3D briloq studio</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
              Real person. 3D briloq. NFC profile.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-500">
              Create a premium physical identity product from a real portrait: stylized 3D figure output, printed card, and a profile link opened by NFC.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="accent"><Link href="/designer/new"><Edit3 className="h-4 w-4" /> Start 3D identity</Link></Button>
              <Button asChild variant="secondary"><Link href="#brilogs"><Sparkles className="h-4 w-4" /> View brilogs</Link></Button>
            </div>
          </div>

          <div className="relative min-h-[610px]">
            <div className="absolute left-2 top-16 h-[470px] w-[330px] overflow-hidden rounded-[48%_52%_42%_58%/38%_44%_56%_62%] shadow-2xl shadow-slate-400/50 ring-1 ring-white/80 md:left-6 md:h-[530px] md:w-[380px]">
              <Image
                src="/dashboard/real-person.jpg"
                alt="Real portrait before 3D briloq creation"
                fill
                priority
                sizes="(min-width: 1024px) 380px, 70vw"
                className="object-cover"
              />
            </div>

           <div className="absolute left-[42%] top-[46%] hidden h-1 w-24 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 shadow-lg md:block">
              <span className="absolute -right-1 -top-[6px] h-4 w-4 rotate-45 border-r-[4px] border-t-[4px] border-r-emerald-500 border-t-emerald-500 bg-transparent" />
            </div>

            <div className="absolute right-0 top-1 h-[600px] w-[430px] max-w-[58vw] md:right-4">
              <div className="absolute inset-x-10 bottom-10 h-16 rounded-full bg-slate-900/20 blur-2xl" />
              <Image
                src="/dashboard/brilog.png"
                alt="3D briloq output based on the real portrait"
                fill
                priority
                sizes="(min-width: 1024px) 430px, 58vw"
                className="object-contain drop-shadow-2xl"
              />
              <div className="absolute bottom-14 right-6 flex h-16 w-16 items-center justify-center rounded-full bg-teal-500 text-sm font-semibold text-white shadow-xl shadow-teal-500/30 ring-8 ring-white/70">
                NFC
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-8">
        <div id="brilogs" className="grid gap-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-600">3D brilog products</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Personal 3D figures with NFC profile links.</h2>
            </div>
            <Button asChild variant="secondary"><Link href="/catalog/brilogs"><Grid3X3 className="h-4 w-4" /> View full 3D catalog</Link></Button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-2 xl:grid-cols-4">
            {brilogs.slice(0, 4).map((brilog, index) => (
              <motion.article
                key={brilog.id}
                className="group relative min-h-[220px] overflow-hidden rounded-[34px] bg-gradient-to-br from-white via-teal-50 to-slate-100 p-6 shadow-xl shadow-slate-300/50 transition hover:-translate-y-1 hover:shadow-2xl sm:min-h-[430px]"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
              >
                <Link href={`/brilogs/${brilog.id}`} className="absolute inset-0 z-20" aria-label={`View ${brilog.title}`} />
                <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-teal-300/30 blur-2xl" />
                <div className="absolute -bottom-20 left-8 h-52 w-52 rounded-full bg-blue-300/25 blur-2xl" />
                <div className="relative z-10 flex h-full flex-col">
                  <div className="relative min-h-32 flex-1 sm:min-h-64">
                    {brilog.image_url ? (
                      <Image
                        src={brilog.image_url}
                        alt={brilog.title}
                        fill
                        sizes="(min-width: 1024px) 30vw, 90vw"
                        className="object-contain drop-shadow-2xl transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <Image
                        src="/dashboard/brilog.png"
                        alt={brilog.title}
                        fill
                        sizes="(min-width: 1024px) 30vw, 90vw"
                        className="object-contain drop-shadow-2xl transition duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="relative z-10 mt-3">
                    <h3 className="text-2xl font-semibold tracking-tight">{brilog.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{brilog.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white">{brilog.price} KZT</span>
                      <span className="text-sm font-semibold text-teal-700">View</span>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>

        <div id="products" className="grid gap-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Printed card products</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Cards stay below the 3D brilog collection.</h2>
            </div>
            <Button asChild variant="secondary"><Link href="/catalog/cards"><Grid3X3 className="h-4 w-4" /> View full card catalog</Link></Button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-5">
            {products.slice(0, 4).map((product, index) => (
              <motion.article
                key={product.id}
                className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
              >
                <Link href={`/products/${product.id}`} className="block">
                  <div
                    className="h-24 bg-cover bg-center sm:h-44"
                    style={{
                      backgroundImage: product.image_url ? `url("${product.image_url}")` : productFallbacks[index % productFallbacks.length],
                    }}
                  />
                  <div className="grid gap-3 p-4">
                    <h2 className="text-lg font-semibold">{product.title}</h2>
                    <p className="min-h-16 text-sm leading-6 text-slate-500">{product.description}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-lg font-bold">{product.price} KZT</span>
                      <span className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white">View</span>
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
            >
              <Link href="/designer/new" className="group block h-full overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl">
                <div className="flex h-44 items-center justify-center bg-gradient-to-br from-teal-100 via-white to-violet-100">
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-xl">
                    <Edit3 className="h-7 w-7" />
                  </span>
                </div>
                <div className="grid gap-3 p-4">
                  <h2 className="text-lg font-semibold">Design Your Own</h2>
                  <p className="min-h-16 text-sm leading-6 text-slate-500">Create a custom card with the editor.</p>
                  <span className="text-lg font-bold">Custom</span>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>

        {catalogs.map((catalog) => (
          <div key={catalog.id} className="grid gap-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-600">Product catalog</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">{catalog.title}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{catalog.description}</p>
              </div>
              <Button asChild variant="secondary"><Link href={`/catalog/${catalog.slug}`}><Grid3X3 className="h-4 w-4" /> View full catalog</Link></Button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-2 xl:grid-cols-4">
              {(catalog.products ?? []).slice(0, 4).map((item, index) => (
                <CatalogProductCard key={item.id} catalog={catalog} item={item} index={index} />
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

function CatalogProductCard({ catalog, item, index }: { catalog: PhpCatalog; item: PhpCatalogProduct; index: number }) {
  return (
    <motion.article
      className="group relative min-h-[200px] overflow-hidden rounded-[30px] bg-white p-5 shadow-xl shadow-slate-300/45 ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-2xl sm:min-h-[380px]"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Link href={`/catalog/${catalog.slug}/${item.id}`} className="absolute inset-0 z-20" aria-label={`View ${item.title}`} />
      <div className="relative h-28 sm:h-56">
        {item.image_url ? (
          <Image src={item.image_url} alt={item.title} fill sizes="(min-width: 1024px) 25vw, 90vw" className="object-contain drop-shadow-xl transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="h-full rounded-[24px] bg-gradient-to-br from-slate-950 via-teal-700 to-slate-100" />
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-xl font-semibold tracking-tight">{item.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{item.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white">{item.price} KZT</span>
          <span className="text-sm font-semibold text-teal-700">View</span>
        </div>
      </div>
    </motion.article>
  );
}
