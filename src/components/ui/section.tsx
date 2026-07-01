import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Section({
  id,
  eyebrow,
  title,
  children,
  className,
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("px-4 py-20 sm:py-28", className)}>
      <div className="mx-auto max-w-7xl">
        {(eyebrow || title) && (
          <div className="mb-10 max-w-3xl">
            {eyebrow && <p className="mb-3 text-sm font-medium text-teal-500">{eyebrow}</p>}
            {title && <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">{title}</h2>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
