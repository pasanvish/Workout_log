import React from 'react';
import type { Badge } from '../types';

export default function BadgeEmblem({ badge, earned = true }: { badge: Badge; earned?: boolean }) {
  return (
    <span className="badge-emblem" data-tone={badge.tone} data-earned={earned} aria-hidden="true">
      <svg className="absolute inset-0 size-full" viewBox="0 0 48 48" fill="none">
        <path d="M24 2 43 10v22L24 46 5 32V10L24 2Z" fill="currentColor" fillOpacity=".14" stroke="currentColor" strokeOpacity=".65" />
        <path d="M24 7 38 13v17L24 40 10 30V13L24 7Z" stroke="currentColor" strokeOpacity=".18" />
      </svg>
      <badge.icon className="relative size-6" />
    </span>
  );
}
