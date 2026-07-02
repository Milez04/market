"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Box,
  Brain,
  CreditCard,
  Layers3,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";
import { templates, pricing } from "@/lib/sample-data";
import { useDesignerStore } from "@/store/designer-store";
import { CardPreview3D } from "@/components/three/card-preview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketingNav } from "@/components/ui/shell";
import { Section } from "@/components/ui/section";
import { currency } from "@/lib/utils";

const fadeUp = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

const features = [
  { icon: Layers3, title: "Canva-grade editor", body: "Layers, snapping, grids, alignment, lock states, grouping, keyboard shortcuts, and export tooling." },
  { icon: Box, title: "Live 3D proofing", body: "Instant front/back previews with thickness, rounded corners, lighting, foil, emboss, and spot UV simulation." },
  { icon: Brain, title: "AI generation", body: "Generate layouts, color systems, copy, backgrounds, and optimized template variants from a short brief." },
  { icon: PackageCheck, title: "Print intelligence", body: "Bleed, safe area, DPI, quality checks, CMYK preview workflows, and production-ready exports." },
  { icon: CreditCard, title: "Commerce built in", body: "Quantity, shipping options, Stripe checkout, order tracking, invoice-ready history, and admin fulfillment." },
  { icon: ShieldCheck, title: "Team operations", body: "Supabase auth, saved projects, brand assets, profiles, roles, analytics, and admin controls." },
];

export function LandingPage() {
  const { elements } = useDesignerStore();

  return (
    <main className="premium-gradient min-h-screen overflow-hidden">
      <MarketingNav />
      <section className="relative px-4 pb-16 pt-28 sm:pt-36">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <Badge className="mb-5 bg-white/10 text-foreground">
              <Sparkles className="mr-2 h-3.5 w-3.5 text-teal-400" />
              AI-native card design, 3D proofing, and print commerce
            </Badge>
            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight sm:text-7xl lg:text-8xl">
              CardForge 3D
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              Design premium business cards, wedding invitations, VIP passes, ID cards, loyalty cards, and custom print products with a live physically lit 3D preview.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="accent">
                <Link href="/designer/new"><Wand2 className="h-4 w-4" /> Launch editor</Link>
              </Button>
              <Button asChild size="lg" variant="glass">
                <Link href="/dashboard">View dashboard</Link>
              </Button>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-4 text-sm">
              {["300 DPI exports", "Stripe checkout", "Supabase auth"].map((item) => (
                <div key={item} className="glass rounded-lg px-4 py-3">
                  <BadgeCheck className="mb-2 h-4 w-4 text-teal-400" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.75, delay: 0.1 }}>
            <CardPreview3D elements={elements} className="h-[430px] sm:h-[580px]" />
          </motion.div>
        </div>
      </section>

      <Section id="features" eyebrow="Platform" title="Every serious card workflow, in one polished studio.">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <motion.div key={feature.title} {...fadeUp}>
              <Card className="glass h-full">
                <CardHeader>
                  <feature.icon className="mb-4 h-6 w-6 text-teal-400" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-muted-foreground">{feature.body}</CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>

      <Section id="templates" eyebrow="Templates" title="Launch with professional card categories already modeled.">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <motion.div key={template.id} {...fadeUp}>
              <Card className="group overflow-hidden bg-card/75 transition hover:-translate-y-1 hover:shadow-glow">
                <div
                  className="h-24 border-b sm:h-44"
                  style={{
                    background: `linear-gradient(135deg, ${template.palette[0]}, ${template.palette[2]}, ${template.palette[3]})`,
                  }}
                >
                  <div className="flex h-full items-end p-5 text-white">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] opacity-75">{template.category}</p>
                      <h3 className="text-2xl font-semibold">{template.title}</h3>
                    </div>
                  </div>
                </div>
                <CardContent className="pt-5">
                  <p className="min-h-12 text-sm text-muted-foreground">{template.audience}</p>
                  <div className="mt-5 flex items-center justify-between">
                    <Badge>{template.finish}</Badge>
                    <span className="text-sm font-medium">From {currency(template.priceFrom)}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>

      <Section eyebrow="Proofs" title="Customers see the print finish before they buy.">
        <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <motion.div {...fadeUp}>
            <CardPreview3D elements={elements} finish="spot-uv" side="back" className="h-[520px]" label="Back side . spot UV . rounded corners" />
          </motion.div>
          <motion.div {...fadeUp} className="grid gap-4">
            {["Photo personalization for family, wedding, birthday, and event cards.", "QR and barcode generation for VIP passes, IDs, and memberships.", "Paper stock, finish, quantity, shipping, and checkout are connected to orders."].map((copy) => (
              <Card key={copy} className="glass p-5 text-sm leading-6 text-muted-foreground">{copy}</Card>
            ))}
          </motion.div>
        </div>
      </Section>

      <Section id="pricing" eyebrow="Pricing" title="Start with design, scale into production.">
        <div className="grid gap-4 md:grid-cols-3">
          {pricing.map((tier, index) => (
            <Card key={tier.name} className={`glass p-6 ${index === 1 ? "ring-2 ring-teal-400" : ""}`}>
              <p className="text-sm text-muted-foreground">{tier.name}</p>
              <div className="mt-4 text-4xl font-semibold">{tier.price}<span className="text-sm text-muted-foreground">/mo</span></div>
              <p className="mt-4 min-h-12 text-sm leading-6 text-muted-foreground">{tier.details}</p>
              <Button asChild className="mt-6 w-full" variant={index === 1 ? "accent" : "secondary"}>
                <Link href="/auth">Choose {tier.name}</Link>
              </Button>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="faq" eyebrow="FAQ" title="Built for design teams and print operators.">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ["Can I export print PDFs?", "Yes. The architecture includes high-resolution PDF, SVG, PNG, JPG, bleed, safe area, and DPI checks."],
            ["Does it support AI designs?", "Yes. The AI route is ready for provider integration and returns structured layouts, palette, copy, and production notes."],
            ["Can customers order cards?", "Yes. Stripe checkout, order tables, quantity, shipping, and webhook fulfillment are included."],
            ["Is there an admin panel?", "Yes. Admin surfaces cover templates, assets, users, orders, analytics, and revenue tracking."],
          ].map(([question, answer]) => (
            <Card key={question} className="glass p-6">
              <h3 className="font-semibold">{question}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{answer}</p>
            </Card>
          ))}
        </div>
      </Section>

      <footer className="px-4 pb-10">
        <div className="glass mx-auto flex max-w-7xl flex-col gap-4 rounded-lg p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">CardForge 3D . Premium card design, proofing, and print commerce.</p>
          <Button asChild variant="accent"><Link href="/designer/new">Create a card</Link></Button>
        </div>
      </footer>
    </main>
  );
}
