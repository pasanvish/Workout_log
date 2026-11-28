import React, { useEffect, useRef } from 'react';

const width = 144;
const height = 272;
const body = 'M72 4 C60 4 55 14 56 24 C56 34 61 41 64 43 L63 51 C58 55 47 55 40 60 C33 65 31 76 29 89 L23 115 C18 127 16 140 14 151 L9 163 C8 167 9 174 12 177 L16 173 L19 162 L23 164 L28 153 L35 126 L43 103 C47 114 48 128 46 141 C43 154 45 170 48 184 L51 206 C50 217 53 232 56 245 L56 257 L51 263 Q50 269 61 269 L66 267 L68 247 L72 194 L76 247 L78 267 L83 269 Q94 269 93 263 L88 257 L88 245 C91 232 94 217 93 206 L96 184 C99 170 101 154 98 141 C96 128 97 114 101 103 L109 126 L116 153 L121 164 L125 162 L128 173 L132 177 C135 174 136 167 135 163 L130 151 C128 140 126 127 121 115 L115 89 C113 76 111 65 104 60 C97 55 86 55 81 51 L80 43 C83 41 88 34 88 24 C89 14 84 4 72 4 Z';

interface Region {
  group: string;
  muscles: readonly string[];
  path: string;
  single?: boolean;
}

const shoulderFront: Region = { group: 'Shoulders', muscles: ['Front delts', 'Side delts'], path: 'M42 64 Q48 60 55 62 Q53 69 44 74 L39 88 Q34 86 35 80 Q36 69 42 64 Z' };
const shoulderBack: Region = { group: 'Shoulders', muscles: ['Rear delts', 'Side delts'], path: 'M40 64 Q48 60 55 64 Q49 71 46 80 L38 89 Q33 86 35 78 Q37 69 40 64 Z' };
const forearms: Region = { group: 'Forearms', muscles: ['Brachioradialis', 'Forearm flexors'], path: 'M29 116 Q34 119 35 123 L25 149 L20 154 Q20 139 24 129 Z' };

const front: Region[] = [
  shoulderFront,
  { group: 'Chest', muscles: ['Chest', 'Upper chest'], path: 'M56 65 Q63 60 69 63 L70 79 Q63 88 50 86 L45 81 Q48 70 56 65 Z' },
  { group: 'Chest', muscles: ['Serratus anterior'], path: 'M48 89 Q52 91 55 89 L57 110 L51 115 Q48 101 48 89 Z' },
  { group: 'Biceps', muscles: ['Biceps', 'Brachialis'], path: 'M37 90 Q41 86 43 90 Q42 102 35 113 Q29 115 30 108 Z' },
  forearms,
  { group: 'Core', muscles: ['Abs', 'Deep abs'], path: 'M59 89 Q65 87 70 86 L70 130 Q65 133 60 127 Q57 105 59 89 Z' },
  { group: 'Core', muscles: ['Obliques', 'Hip flexors'], path: 'M54 114 L60 130 Q65 135 70 135 L69 146 Q59 142 50 135 Z' },
  { group: 'Quads', muscles: ['Quads'], path: 'M49 138 Q58 145 64 149 Q66 163 61 185 L56 201 Q52 197 51 185 Q44 157 49 138 Z' },
  { group: 'Adductors', muscles: ['Hip adductors'], path: 'M65 150 Q69 149 70 154 Q70 178 61 193 L63 183 Z' },
  { group: 'Calves', muscles: ['Gastrocnemius', 'Soleus'], path: 'M54 208 Q59 206 60 214 Q61 224 60 236 L57 242 Q54 234 54 224 Z' },
];

const back: Region[] = [
  shoulderBack,
  { group: 'Back', muscles: ['Traps', 'Rhomboids'], path: 'M72 50 L84 58 L97 64 L85 73 L72 96 L59 73 L47 64 L60 58 Z', single: true },
  { group: 'Back', muscles: ['Lats', 'Rhomboids'], path: 'M47 82 Q57 78 62 92 L68 105 L68 118 Q59 113 52 103 Z' },
  { group: 'Back', muscles: ['Spinal erectors'], path: 'M67 101 L70 101 L70 133 L62 138 Q60 122 67 101 Z' },
  { group: 'Triceps', muscles: ['Triceps'], path: 'M36 90 Q42 86 44 92 Q42 105 35 114 L30 112 Q30 103 36 90 Z' },
  forearms,
  { group: 'Glutes', muscles: ['Glute max', 'Glute medius', 'Hip abductors'], path: 'M50 133 Q57 129 67 138 Q72 147 67 158 Q60 167 49 160 Q46 148 50 133 Z' },
  { group: 'Hamstrings', muscles: ['Hamstrings'], path: 'M49 163 Q57 168 67 164 Q66 182 60 194 L57 202 Q52 197 51 185 Z' },
  { group: 'Adductors', muscles: ['Hip adductors'], path: 'M68 161 L70 161 Q70 183 63 199 L62 193 Q68 182 68 161 Z' },
  { group: 'Calves', muscles: ['Gastrocnemius', 'Soleus'], path: 'M54 207 Q57 203 62 207 Q67 214 63 227 L58 244 L55 241 Q55 228 53 219 Z' },
];

function BodySide({ label, regions, color }: { label: string; regions: Region[]; color: (region: Region) => string | undefined }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.lineJoin = 'round';
    ctx.lineWidth = 0.9;
    ctx.fillStyle = '#202d38';
    ctx.strokeStyle = '#4b6171';
    const outline = new Path2D(body);
    ctx.fill(outline);
    ctx.stroke(outline);

    for (const region of regions) {
      const shape = new Path2D(region.path);
      ctx.fillStyle = color(region) ?? '#314451';
      ctx.strokeStyle = '#16232b';
      ctx.fill(shape);
      ctx.stroke(shape);
      if (region.single) continue;
      ctx.save();
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.fill(shape);
      ctx.stroke(shape);
      ctx.restore();
    }
  }, [color, regions]);

  return <figure className="min-w-0 text-center">
    <canvas ref={canvas} width={width * 2} height={height * 2} aria-hidden="true" className="mx-auto block w-full max-w-[8rem]" />
    <figcaption className="mt-1 text-xs font-semibold text-text-secondary">{label}</figcaption>
  </figure>;
}

export function BodyMuscleMap({ color, label }: { color: (region: Region) => string | undefined; label: string }) {
  return <div role="group" aria-label={label} className="mx-auto grid max-w-[19rem] grid-cols-2 gap-4">
    <BodySide label="Front" regions={front} color={color} />
    <BodySide label="Back" regions={back} color={color} />
  </div>;
}

export function ExerciseTargetMap({ primary, secondary }: { primary: readonly string[]; secondary: readonly string[] }) {
  return (
    <div className="rounded-xl border border-border-color/70 bg-background-dark py-3">
      <BodyMuscleMap label="Front and back exercise target map" color={({ muscles }) => {
        if (muscles.some(muscle => primary.includes(muscle))) return '#80eacf';
        if (muscles.some(muscle => secondary.includes(muscle))) return '#efb078';
      }} />
      <div className="mt-3 flex justify-center gap-4 text-xs text-text-secondary">
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#80eacf]" /> Primary</span>
        {secondary.length > 0 && <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#efb078]" /> Secondary</span>}
      </div>
    </div>
  );
}
