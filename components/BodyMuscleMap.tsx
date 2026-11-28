import React, { useEffect, useRef, useState } from 'react';

const width = 510;
const height = 1160;
const top = 28;
const photoUrl = `${import.meta.env.BASE_URL}anatomy/athlete-front-back.webp`;

interface Region {
  group: string;
  muscles: readonly string[];
  path: string;
  single?: boolean;
}

const front: Region[] = [
  { group: 'Neck', muscles: ['Neck'], path: 'M283 174 Q300 190 318 187 Q339 186 358 173 L360 199 Q345 217 318 223 Q291 218 280 203 Z', single: true },
  { group: 'Shoulders', muscles: ['Front delts', 'Side delts', 'Shoulders'], path: 'M213 235 Q193 231 177 253 Q154 276 156 309 Q156 321 162 330 Q187 326 205 310 Q210 289 226 265 Q232 249 213 235 Z' },
  { group: 'Chest', muscles: ['Chest', 'Upper chest'], path: 'M241 250 Q275 237 308 246 Q315 266 313 299 Q307 334 284 345 Q249 356 220 334 Q205 318 211 296 Q220 273 241 250 Z' },
  { group: 'Chest', muscles: ['Serratus anterior'], path: 'M213 338 Q224 352 243 357 L247 388 Q235 411 230 431 Q225 403 214 378 Q208 359 213 338 Z' },
  { group: 'Biceps', muscles: ['Biceps', 'Brachialis'], path: 'M165 329 Q185 331 201 316 Q212 331 205 361 Q196 396 171 417 Q155 428 144 414 Q144 378 165 329 Z' },
  { group: 'Forearms', muscles: ['Forearm flexors', 'Brachioradialis', 'Forearms'], path: 'M146 420 Q163 431 176 420 Q177 451 155 488 L120 557 L103 581 Q100 542 111 505 Q116 464 146 420 Z' },
  { group: 'Core', muscles: ['Abs', 'Deep abs'], path: 'M254 357 Q275 350 292 343 L314 329 L315 508 Q286 524 261 510 Q245 471 248 441 Q252 416 246 391 Z' },
  { group: 'Core', muscles: ['Obliques', 'Hip flexors'], path: 'M231 402 Q240 414 245 445 Q248 479 260 512 Q237 518 225 509 Q230 479 228 454 Q224 432 231 402 Z' },
  { group: 'Quads', muscles: ['Quads'], path: 'M203 665 Q236 679 283 668 Q301 688 291 724 Q281 752 273 792 Q265 828 245 838 Q219 829 210 800 Q199 767 200 739 Q194 696 203 665 Z' },
  { group: 'Adductors', muscles: ['Hip adductors'], path: 'M283 654 L305 645 Q302 683 295 719 Q290 746 278 768 Q286 733 286 695 Z' },
  { group: 'Calves', muscles: ['Calves', 'Gastrocnemius', 'Soleus'], path: 'M216 852 Q230 863 250 850 Q264 875 262 910 Q260 946 239 998 L222 1042 Q215 1016 210 989 Q201 949 195 923 Q187 886 216 852 Z' },
];

const back: Region[] = [
  { group: 'Neck', muscles: ['Neck'], path: 'M895 153 Q930 165 969 151 L971 185 Q959 206 934 212 Q909 206 893 189 Z', single: true },
  { group: 'Back', muscles: ['Traps', 'Mid back'], path: 'M930 190 Q909 197 887 208 L826 236 Q851 239 873 257 Q905 274 918 309 L934 340 L953 305 Q965 269 995 256 Q1018 240 1040 236 L981 204 Q958 190 934 190 Z', single: true },
  { group: 'Shoulders', muscles: ['Rear delts', 'Side delts', 'Shoulders'], path: 'M825 236 Q801 234 785 256 Q767 283 770 317 Q777 329 793 323 Q815 312 830 300 Q841 280 851 257 Q839 243 825 236 Z' },
  { group: 'Back', muscles: ['Rhomboids', 'Mid back'], path: 'M850 267 Q879 270 904 305 L928 351 L918 376 Q887 361 864 338 Q850 317 842 300 Z' },
  { group: 'Back', muscles: ['Lats'], path: 'M832 310 Q849 332 873 341 Q900 368 923 381 Q920 415 893 439 Q871 450 845 476 Q846 443 839 410 Q832 378 826 353 Q824 328 832 310 Z' },
  { group: 'Back', muscles: ['Spinal erectors'], path: 'M915 365 Q928 383 928 414 L926 496 Q907 498 888 500 L904 466 Q915 430 915 401 Z' },
  { group: 'Triceps', muscles: ['Triceps'], path: 'M779 323 Q795 330 815 310 Q824 335 815 372 Q807 402 787 428 Q769 439 753 418 Q759 365 779 323 Z' },
  { group: 'Forearms', muscles: ['Forearm extensor', 'Forearm extensors', 'Brachioradialis', 'Forearm flexors', 'Forearms'], path: 'M753 423 Q767 443 786 430 Q781 463 757 501 L722 567 Q714 581 710 570 Q713 534 720 497 Q729 447 753 423 Z' },
  { group: 'Glutes', muscles: ['Glute max', 'Glute medius', 'Hip abductors', 'Glutes'], path: 'M850 504 Q880 500 913 502 L931 520 L930 604 Q919 626 881 640 Q845 645 817 625 Q819 577 828 548 Q835 520 850 504 Z' },
  { group: 'Hamstrings', muscles: ['Hamstrings'], path: 'M821 642 Q861 657 913 637 Q917 668 907 704 Q902 750 879 800 Q867 822 839 834 Q825 804 821 780 Q813 743 811 704 Q812 670 821 642 Z' },
  { group: 'Adductors', muscles: ['Hip adductors'], path: 'M911 637 Q922 637 927 628 Q923 680 912 721 Q905 751 889 771 Q898 739 903 704 Z' },
  { group: 'Calves', muscles: ['Calves', 'Gastrocnemius', 'Soleus'], path: 'M831 842 Q851 848 877 841 Q883 883 876 923 Q866 966 845 1015 L819 1037 Q810 1010 804 978 Q794 927 800 892 Q809 855 831 842 Z' },
];

const views = [
  { label: 'Front', left: 62, center: 317, regions: front },
  { label: 'Back', left: 678, center: 933, regions: back },
] as const;

type ColorRegion = (region: Region) => string | undefined;

function BodySide({ view, photo, color, expanded }: {
  view: typeof views[number]; photo?: HTMLImageElement; color: ColorRegion; expanded: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx || !photo) return;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(photo, view.left, top, width, height, 0, 0, width, height);
    ctx.save();
    ctx.translate(-view.left, -top);
    const paint = (path: Path2D, highlight: string) => {
      ctx.fillStyle = highlight;
      ctx.globalCompositeOperation = 'color';
      ctx.globalAlpha = 0.92;
      ctx.fill(path);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.38;
      ctx.fill(path);
      ctx.globalAlpha = 0.71;
      ctx.strokeStyle = highlight;
      ctx.lineWidth = 2;
      ctx.stroke(path);
    };
    for (const region of view.regions) {
      const highlight = color(region);
      if (!highlight) continue;
      const shape = new Path2D(region.path);
      paint(shape, highlight);
      if (region.single) continue;
      ctx.save();
      ctx.translate(view.center * 2, 0);
      ctx.scale(-1, 1);
      paint(shape, highlight);
      ctx.restore();
    }
    ctx.restore();
  }, [view, color, photo]);

  return <figure className="min-w-0 text-center">
    <canvas ref={canvas} width={width} height={height} aria-hidden="true"
      className={`mx-auto block w-full rounded-xl bg-[#111b23] ${expanded ? 'max-w-[15rem]' : 'max-w-[11rem]'}`} />
    <figcaption className="mt-1 text-xs font-semibold text-text-secondary">{view.label}</figcaption>
  </figure>;
}

export function BodyMuscleMap({ color, label }: { color: ColorRegion; label: string }) {
  const [photo, setPhoto] = useState<HTMLImageElement>();
  const [loadFailed, setLoadFailed] = useState(false);
  const [zoom, setZoom] = useState<(typeof views)[number]['label']>();
  useEffect(() => {
    const image = new Image();
    image.onload = () => setPhoto(image);
    image.onerror = () => setLoadFailed(true);
    image.src = photoUrl;
    return () => { image.onload = null; image.onerror = null; };
  }, []);

  if (loadFailed) return <p className="text-center text-xs text-text-secondary">Muscle image unavailable.</p>;
  const visible = zoom ? views.filter(view => view.label === zoom) : views;
  return <div role="group" aria-label={label} className="mx-auto max-w-[24rem]">
    <div className={`grid gap-2 ${zoom ? 'grid-cols-1' : 'grid-cols-2'}`}>
      {visible.map(view => <BodySide key={view.label} view={view} photo={photo} color={color} expanded={Boolean(zoom)} />)}
    </div>
    <div role="group" aria-label="Muscle map view" className="mt-3 flex flex-wrap justify-center gap-1.5">
      <button type="button" className="category-chip" aria-pressed={!zoom} onClick={() => setZoom(undefined)}>Both</button>
      {views.map(({ label }) => <button type="button" className="category-chip" key={label}
        aria-pressed={zoom === label} onClick={() => setZoom(label)}>{label}</button>)}
    </div>
  </div>;
}

export function ExerciseTargetMap({ primary, secondary }: { primary: readonly string[]; secondary: readonly string[] }) {
  return (
    <div className="rounded-xl border border-border-color/70 bg-background-dark p-3">
      <BodyMuscleMap label="Front and back exercise target map" color={({ muscles }) => {
        if (muscles.some(muscle => primary.includes(muscle))) return '#80eacf';
        if (muscles.some(muscle => secondary.includes(muscle))) return '#efb078';
      }} />
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-text-secondary">
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#80eacf]" /> Primary</span>
        {secondary.length > 0 && <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#efb078]" /> Secondary</span>}
      </div>
    </div>
  );
}
