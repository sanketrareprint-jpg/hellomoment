'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

interface Slide {
  eyebrow: string;
  title: React.ReactNode;
  body: string;
}

// Rotating promo slides for the pre-login landing page hero — pure text,
// pulled from raregreet.com's real features (see CAPABILITIES in
// src/app/page.tsx) so it never overpromises anything the product doesn't do.
const SLIDES: Slide[] = [
  {
    eyebrow: 'Automatic, every single day',
    title: (
      <>
        Never miss a customer&rsquo;s{' '}
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-fuchsia-600">
          birthday, anniversary,
        </span>{' '}
        or festival again
      </>
    ),
    body: 'Add your customers once. raregreet.com automatically designs a personalized flyer with their name, date and photo, and sends it on WhatsApp — to them and to you — the moment it’s their day.',
  },
  {
    eyebrow: '',
    title: (
      <>
        Start sending{' '}
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-fuchsia-600">
          the same day you sign up
        </span>
      </>
    ),
    body: 'Starter flyers for every major birthday, anniversary and festival occasion come built in — pick one, add your brand kit, and you\'re ready to send.',
  },
  {
    eyebrow: 'Sent on your real WhatsApp',
    title: (
      <>
        Wishes that land{' '}
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-fuchsia-600">
          like they&rsquo;re from you
        </span>
      </>
    ),
    body: 'Every flyer goes out through your own WhatsApp Business account via AiSensy — not a generic bot number — with your logo, phone number and address on it.',
  },
  {
    eyebrow: 'No subscription',
    title: (
      <>
        Pay only for{' '}
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-fuchsia-600">
          what you actually send
        </span>
      </>
    ),
    body: 'Recharge your wallet whenever you like — every wish just draws down your balance, and bigger recharges unlock a cheaper rate per message.',
  },
];

const AUTO_ADVANCE_MS = 6000;

export default function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused]);

  const slide = SLIDES[index];

  return (
    <section
      className="relative max-w-4xl mx-auto text-center px-6 pt-4 sm:pt-16 pb-20"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] rounded-full bg-gradient-to-br from-brand-200/40 to-fuchsia-200/30 blur-3xl -z-10" />

      <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-3" aria-hidden="true">
        {slide.eyebrow}
      </p>

      <div aria-live="polite">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 min-h-[6.5rem] sm:min-h-[8.5rem]">
          {slide.title}
        </h1>
        <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto">{slide.body}</p>
      </div>

      <div className="mt-8 flex items-center justify-center gap-4">
        <Link
          href="/register"
          className="btn-primary relative text-base px-6 py-3 animate-pulse-glow hover:scale-105"
        >
          Create your free account
          <span className="absolute -top-2.5 -right-2.5 flex h-6 w-6">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75" />
            <span className="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500 text-[11px] shadow-sm">
              🎁
            </span>
          </span>
        </Link>
        <Link href="/login" className="btn-secondary text-base px-6 py-3">
          I already have an account
        </Link>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2">
        {SLIDES.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show slide ${i + 1}`}
            aria-current={i === index}
            className={
              'h-2 rounded-full transition-all ' +
              (i === index ? 'w-6 bg-brand-600' : 'w-2 bg-gray-300 hover:bg-gray-400')
            }
          />
        ))}
      </div>
    </section>
  );
}
