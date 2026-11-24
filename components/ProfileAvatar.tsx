import React from 'react';
import type { Profile } from '../types';

export default function ProfileAvatar({ profile, className = '' }: { profile: Pick<Profile, 'name' | 'avatar'>; className?: string }) {
  return (
    <span className={`profile-avatar ${className}`} aria-hidden="true">
      {profile.avatar
        ? <img src={profile.avatar} alt="" className="size-full object-cover" />
        : Array.from(profile.name.trim())[0]?.toLocaleUpperCase() || '?'}
    </span>
  );
}
