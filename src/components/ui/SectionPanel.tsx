import type { ReactNode } from 'react';

type Props = { title: string; subtitle?: string; children: ReactNode };

export function SectionPanel({ title, subtitle, children }: Props) {
  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}
