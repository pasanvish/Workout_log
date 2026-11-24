import React, { useEffect, useRef, useState } from 'react';
import { ACCENTS, cleanAppearance, DEFAULT_WEEKLY_GOAL, resizeAvatar } from '../profile';
import type { Accent, Profile } from '../types';
import ModalFrame from './ModalFrame';
import ProfileAvatar from './ProfileAvatar';

interface ProfileSettingsProps {
  profile: Profile;
  onSave: (profile: Profile) => void;
  onClose: () => void;
  onSwitch: () => void;
}

export default function ProfileSettings({ profile, onSave, onClose, onSwitch }: ProfileSettingsProps) {
  const [draft, setDraft] = useState<Profile>(profile);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const photoRequest = useRef(0);
  useEffect(() => () => { photoRequest.current++; }, []);

  async function selectPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const request = ++photoRequest.current;
    setLoading(true);
    setError('');
    try {
      const avatar = await resizeAvatar(file);
      if (request === photoRequest.current) setDraft(previous => ({ ...previous, avatar }));
    } catch (reason) {
      if (request === photoRequest.current) setError(reason instanceof Error ? reason.message : 'Could not open this photo.');
    } finally {
      if (request === photoRequest.current) setLoading(false);
    }
  }

  return (
    <ModalFrame title="Your profile" onClose={onClose} footer={
      <>
        <button type="button" onClick={onSwitch} className="panel-action mr-auto">Switch profile</button>
        <button type="submit" form="profile-settings" disabled={!draft.name.trim() || loading} className="panel-action panel-action-primary disabled:opacity-40">Save profile</button>
      </>
    }>
      <form id="profile-settings" className="space-y-5" onSubmit={event => {
        event.preventDefault();
        if (!draft.name.trim() || loading) return;
        try {
          onSave({ id: draft.id, name: draft.name.trim(), ...cleanAppearance(draft) });
        } catch {
          setError('Could not save this profile. Free up device storage or try a smaller photo.');
        }
      }}>
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border-color bg-background-dark p-3">
          <ProfileAvatar profile={draft} className="size-16 text-2xl" />
          <div className="flex flex-1 flex-wrap gap-2">
            <button type="button" className="panel-action" onClick={() => fileInput.current?.click()} disabled={loading}>
              {loading ? 'Opening photo…' : draft.avatar ? 'Change photo' : 'Add profile photo'}
            </button>
            {draft.avatar && <button type="button" className="panel-action" disabled={loading} onClick={() => setDraft(previous => ({ ...previous, avatar: undefined }))}>Remove photo</button>}
          </div>
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} hidden />
        </div>
        <label className="block text-xs font-semibold text-text-secondary">
          Display name
          <input className="track-input mt-1.5 w-full" value={draft.name} onChange={event => setDraft(previous => ({ ...previous, name: event.target.value }))} />
        </label>
        <fieldset>
          <legend className="mb-2 text-xs font-semibold text-text-secondary">App accent</legend>
          <div className="grid grid-cols-4 gap-1.5">
            {Object.entries(ACCENTS).map(([id, { label, color }]) => (
              <label key={id} className="accent-option">
                <input className="sr-only" type="radio" name="app-accent" value={id} checked={(draft.accent ?? 'mint') === id}
                  onChange={() => setDraft(previous => ({ ...previous, accent: id as Accent }))} />
                <span className="size-4 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block text-xs font-semibold text-text-secondary">
          Weekly workout goal
          <select className="track-input mt-1.5 w-full" value={draft.weeklyGoal ?? DEFAULT_WEEKLY_GOAL}
            onChange={event => setDraft(previous => ({ ...previous, weeklyGoal: Number(event.target.value) }))}>
            {Array.from({ length: 7 }, (_, index) => index + 1).map(n => <option key={n} value={n}>{n} {n === 1 ? 'workout' : 'workouts'} per week</option>)}
          </select>
        </label>
        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      </form>
    </ModalFrame>
  );
}
