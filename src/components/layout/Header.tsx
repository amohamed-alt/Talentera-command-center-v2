export function Header({ badge, title, subtitle }: { badge: string; title: string; subtitle: string }) {
  return <header className="hero"><div><span className="eyebrow">{badge}</span><h1>{title}</h1><p>{subtitle}</p></div></header>;
}
