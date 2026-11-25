import React from "react";
import Image from "next/image";
import Link from "next/link";
import { LegalLinks } from "./LegalLinks";

export interface LegalSection {
  id: string;
  title: string;
  paragraphs: string[];
  items?: string[];
}

interface LegalDocumentProps {
  title: string;
  updatedAt: string;
  intro: string;
  sections: LegalSection[];
}

export function LegalDocument({ title, updatedAt, intro, sections }: LegalDocumentProps) {
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-outline-variant/50 bg-surface-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xl font-extrabold tracking-tight text-primary"
          >
            <Image
              src="/images/nexofood-logo.png"
              alt=""
              width={28}
              height={28}
              className="w-7 h-7 rounded-lg object-contain shrink-0"
            />
            <span>NexoFood</span>
          </Link>
          <Link
            href="/"
            className="text-sm font-semibold text-on-surface-variant hover:text-primary"
          >
            Ir al inicio
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">{title}</h1>
        <p className="mt-2 text-sm text-on-surface-variant">Última actualización: {updatedAt}</p>
        <p className="mt-6 leading-relaxed text-on-surface">{intro}</p>

        <nav aria-label="Contenido" className="mt-8 rounded-xl border border-outline-variant/60 bg-surface-card p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Contenido</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-primary hover:underline">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-8">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-6">
              <h2 className="text-lg font-bold text-on-surface">
                {i + 1}. {s.title}
              </h2>
              {s.paragraphs.map((p) => (
                <p key={p} className="mt-2 leading-relaxed text-on-surface-variant">
                  {p}
                </p>
              ))}
              {s.items && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-on-surface-variant">
                  {s.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t border-outline-variant/50 bg-surface-container-low">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-on-surface-variant sm:flex-row sm:px-6">
          <p>© 2026 NexoFood. Todos los derechos reservados.</p>
          <LegalLinks />
        </div>
      </footer>
    </div>
  );
}
