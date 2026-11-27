import type { Accent, ProfileAppearance } from './types';

export const ACCENTS: Record<Accent, { label: string; color: string }> = {
  mint: { label: 'Mint', color: '#75ebc9' },
  blue: { label: 'Sky', color: '#8edbff' },
  violet: { label: 'Lilac', color: '#d4b5ff' },
  amber: { label: 'Amber', color: '#ffd285' },
};

export const DEFAULT_WEEKLY_GOAL = 3;
export const DEFAULT_REST_SECONDS = 90;
export const REST_DURATIONS = [15, 30, 45, 60, 90, 120, 150, 180, 240, 300];

export function cleanAppearance(value: unknown): ProfileAppearance {
  if (!value || typeof value !== 'object') return {};
  const data = value as Record<string, unknown>;
  const result: ProfileAppearance = {};
  if (typeof data.accent === 'string' && Object.hasOwn(ACCENTS, data.accent)) result.accent = data.accent as Accent;
  if (typeof data.weeklyGoal === 'number' && Number.isInteger(data.weeklyGoal) && data.weeklyGoal >= 1 && data.weeklyGoal <= 7) {
    result.weeklyGoal = data.weeklyGoal;
  }
  if (typeof data.restSeconds === 'number' && REST_DURATIONS.includes(data.restSeconds)) {
    result.restSeconds = data.restSeconds;
  }
  if (typeof data.avatar === 'string' && data.avatar.length <= 100_000 && /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(data.avatar)) {
    result.avatar = data.avatar;
  }
  return result;
}

export async function resizeAvatar(file: File): Promise<string> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 15 * 1024 * 1024) {
    throw new Error('Choose a JPEG, PNG, or WebP photo under 15 MB.');
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const side = Math.min(image.naturalWidth, image.naturalHeight);
    if (!side) throw new Error('This image could not be read.');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 192;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not resize the photo.');
    context.fillStyle = '#121c24';
    context.fillRect(0, 0, 192, 192);
    context.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, 192, 192);
    const avatar = canvas.toDataURL('image/jpeg', 0.8);
    if (!cleanAppearance({ avatar }).avatar) throw new Error('Could not save the photo.');
    return avatar;
  } finally {
    URL.revokeObjectURL(url);
  }
}
