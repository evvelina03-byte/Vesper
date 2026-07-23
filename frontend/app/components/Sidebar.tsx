'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', href: '/', icon: '▦' },
  { label: 'Credit Risk', href: '/credit-risk', icon: '⊕' },
  { label: 'Fraud Detection', href: '/fraud', icon: '◎' },
  { label: 'Portfolio', href: '/portfolio', icon: '↗' },
  { label: 'AI Assistant', href: '/assistant', icon: '✦' },
  { label: 'Markets', href: '/market', icon: '◈' },
  { label: 'Intelligence', href: '/intelligence', icon: '≡' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: '210px',
      minHeight: '100vh',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
      height: '100vh',
    }}>
      <div style={{
        padding: '20px 18px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'var(--blue)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '16px',
        }}>V</div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.3px' }}>Vesper</div>
          <div style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>Financial Intelligence</div>
        </div>
      </div>

      <nav style={{ padding: '12px 10px', flex: 1 }}>
        <div style={{ fontSize: '10px', color: 'var(--text3)', padding: '10px 10px 4px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
          Overview
        </div>
        {navItems.slice(0, 1).map(item => (
          <Link key={item.href} href={item.href} style={{
            display: 'flex', alignItems: 'center', gap: '9px',
            padding: '8px 10px', borderRadius: '7px', cursor: 'pointer',
            fontSize: '13px', marginBottom: '1px', textDecoration: 'none',
            background: pathname === item.href ? 'var(--blue-dim)' : 'transparent',
            color: pathname === item.href ? 'var(--blue)' : 'var(--text2)',
            fontWeight: pathname === item.href ? 600 : 400,
          }}>
            <span>{item.icon}</span> {item.label}
          </Link>
        ))}

        <div style={{ fontSize: '10px', color: 'var(--text3)', padding: '10px 10px 4px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
          Modules
        </div>
        {navItems.slice(1).map(item => (
          <Link key={item.href} href={item.href} style={{
            display: 'flex', alignItems: 'center', gap: '9px',
            padding: '8px 10px', borderRadius: '7px', cursor: 'pointer',
            fontSize: '13px', marginBottom: '1px', textDecoration: 'none',
            background: pathname === item.href ? 'var(--blue-dim)' : 'transparent',
            color: pathname === item.href ? 'var(--blue)' : 'var(--text2)',
            fontWeight: pathname === item.href ? 600 : 400,
          }}>
            <span>{item.icon}</span> {item.label}
          </Link>
        ))}
      </nav>

      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '9px',
          padding: '8px 10px', borderRadius: '7px',
        }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'var(--blue-dim)', border: '1px solid var(--blue)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', color: 'var(--blue)',
          }}>E</div>
          <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Eva Plamadeala</div>
        </div>
      </div>
    </aside>
  );
}
