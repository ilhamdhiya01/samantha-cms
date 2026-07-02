import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MobileNavProps {
  items: { to: string; label: string; end?: boolean }[];
}

export function MobileNav({ items }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="md:hidden inline-flex items-center gap-2 rounded p-2 hover:bg-slate-100"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? 'Tutup menu' : 'Buka menu'}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
      </button>

      {open && (
        <div
          id="mobile-nav"
          role="dialog"
          aria-modal="true"
          className="md:hidden fixed inset-0 z-50 bg-black/40"
          onClick={() => setOpen(false)}
        >
          <nav
            className="absolute left-0 top-0 h-full w-64 bg-white shadow-lg p-4 space-y-1"
            aria-label="Mobile primary"
            onClick={(e) => e.stopPropagation()}
          >
            {items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.end}
                className={({ isActive }) =>
                  cn(
                    'block rounded px-3 py-2 text-sm font-medium',
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                  )
                }
                onClick={() => setOpen(false)}
              >
                {it.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
