import React, { useState } from 'react';
import { Profile } from '../types';

interface ProfileManagerProps {
  profiles: Profile[];
  onAddProfile: (name: string) => void;
  onSelectProfile: (id: string) => void;
}

export default function ProfileManager({ profiles, onAddProfile, onSelectProfile }: ProfileManagerProps) {
  const [newProfileName, setNewProfileName] = useState('');
  const name = newProfileName.trim();

  return (
    <main className="profile-page px-4 pb-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="mx-auto w-full max-w-lg space-y-4">
        <header className="workout-hero">
          <div className="min-w-0">
            <h1 className="text-3xl font-extrabold tracking-tight">Gym Logger</h1>
            <p className="mt-2 text-sm text-text-secondary">Choose a profile to open your workout log.</p>
          </div>
          <img src="./icon.svg" alt="" className="size-20 shrink-0 rounded-2xl border border-border-color sm:size-24" />
        </header>
        {profiles.length > 0 && (
          <section className="tracking-panel">
            <h2 className="mb-3 text-lg font-semibold">Your profiles</h2>
            <div className="grid gap-2.5">
              {profiles.map(profile => (
                <button type="button" key={profile.id} onClick={() => onSelectProfile(profile.id)} className="profile-option">
                  <span aria-hidden="true" className="session-date !size-10 text-sm font-bold">{Array.from(profile.name.trim())[0]?.toLocaleUpperCase() || '?'}</span>
                  <span className="min-w-0 flex-1 break-words text-sm font-semibold">{profile.name}</span>
                  <span aria-hidden="true" className="text-brand-light">→</span>
                </button>
              ))}
            </div>
          </section>
        )}
        <section className="tracking-panel">
          <h2 className="mb-3 text-lg font-semibold">{profiles.length ? 'Add a profile' : 'Create your first profile'}</h2>
          <form onSubmit={event => { event.preventDefault(); if (name) onAddProfile(name); }} className="flex items-end gap-2">
            <label className="min-w-0 flex-1 text-xs font-semibold text-text-secondary">
              Profile name
              <input value={newProfileName} onChange={event => setNewProfileName(event.target.value)} className="track-input mt-1.5 w-full"
                placeholder="Your name" autoComplete="off" />
            </label>
            <button type="submit" className="panel-action panel-action-primary disabled:opacity-40" disabled={!name}>Create</button>
          </form>
        </section>
      </div>
    </main>
  );
}
