// Standalone sanity test for the parts of hellomoment that don't need
// Next.js/Prisma installed — run with the globally available `tsx`:
//   tsx scripts/test-core-logic.ts
// This is a throwaway verification script, not part of the shipped app.

import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

import { generateFlyer, wrapText } from '../src/lib/flyer';
import {
  isSameMonthDay,
  ordinal,
  calculateAge,
  calculateYears,
  getTodayInTimezone,
} from '../src/lib/dateUtils';
import { normalizeWhatsappNumber } from '../src/lib/aisensy';

const TMP = path.join(__dirname, '_test_tmp');

async function main() {
  await fs.mkdir(TMP, { recursive: true });

  // ---- dateUtils ----
  console.log('Testing dateUtils...');
  const today = getTodayInTimezone('Asia/Kolkata');
  console.log('  today in Asia/Kolkata:', today);

  // A DOB with month/day == today, arbitrary birth year.
  const dobToday = new Date(Date.UTC(1990, today.month - 1, today.day));
  assert.equal(isSameMonthDay(dobToday, today, today.year), true, 'same month/day should match');

  const dobOtherDay = new Date(Date.UTC(1990, 0, 1));
  if (!(today.month === 1 && today.day === 1)) {
    assert.equal(isSameMonthDay(dobOtherDay, today, today.year), false, 'different month/day should not match');
  }

  // Feb 29 edge case: in a non-leap year, Feb 29 birthday should match Feb 28.
  const feb29 = new Date(Date.UTC(1992, 1, 29));
  const nonLeapFeb28 = { month: 2, day: 28 };
  assert.equal(isSameMonthDay(feb29, nonLeapFeb28, 2025), true, 'Feb 29 DOB should fire on Feb 28 in a non-leap year');
  const leapFeb29 = { month: 2, day: 29 };
  assert.equal(isSameMonthDay(feb29, leapFeb29, 2024), true, 'Feb 29 DOB should fire on Feb 29 in a leap year');

  assert.equal(ordinal(1), '1st');
  assert.equal(ordinal(2), '2nd');
  assert.equal(ordinal(3), '3rd');
  assert.equal(ordinal(11), '11th');
  assert.equal(ordinal(21), '21st');
  assert.equal(ordinal(25), '25th');

  const age = calculateAge(new Date(Date.UTC(2000, 5, 15)), 2026);
  assert.equal(age, 26);

  const years = calculateYears(new Date(Date.UTC(2016, 0, 1)), 2026);
  assert.equal(years, 10);

  console.log('  dateUtils OK');

  // ---- aisensy ----
  console.log('Testing aisensy.normalizeWhatsappNumber...');
  assert.equal(normalizeWhatsappNumber('9876543210'), '919876543210');
  assert.equal(normalizeWhatsappNumber('+91 98765 43210'), '919876543210');
  assert.equal(normalizeWhatsappNumber('919876543210'), '919876543210');
  console.log('  aisensy OK');

  // ---- wrapText ----
  console.log('Testing flyer.wrapText...');
  const lines = wrapText('Happy Birthday Vrushali Pimpalkar', 500, 48, 2);
  assert.ok(lines.length <= 2, 'should not exceed maxLines');
  console.log('  wrapText produced:', lines);

  // ---- generateFlyer end-to-end with synthetic images ----
  console.log('Testing flyer.generateFlyer (end-to-end composite)...');
  const backgroundPath = path.join(TMP, 'bg.jpg');
  const photoPath = path.join(TMP, 'photo.jpg');
  const outputPath = path.join(TMP, 'out.jpg');

  await sharp({
    create: { width: 1080, height: 1080, channels: 3, background: { r: 219, g: 39, b: 119 } },
  })
    .jpeg()
    .toFile(backgroundPath);

  await sharp({
    create: { width: 500, height: 500, channels: 3, background: { r: 30, g: 30, b: 30 } },
  })
    .jpeg()
    .toFile(photoPath);

  await generateFlyer({
    backgroundPath,
    canvasWidth: 1080,
    canvasHeight: 1080,
    namePlaceholder: {
      x: 540,
      y: 850,
      fontSize: 56,
      color: '#ffffff',
      fontWeight: 700,
      align: 'center',
      maxWidth: 900,
      maxLines: 2,
    },
    name: 'Happy Birthday, Vrushali Pimpalkar!',
    datePlaceholder: {
      x: 540,
      y: 920,
      fontSize: 32,
      color: '#ffffff',
      align: 'center',
      maxWidth: 900,
    },
    dateText: '25 August',
    photoPlaceholder: { x: 390, y: 140, size: 300, shape: 'circle' },
    photoPath,
    outputPath,
  });

  const meta = await sharp(outputPath).metadata();
  assert.equal(meta.width, 1080);
  assert.equal(meta.height, 1080);
  assert.equal(meta.format, 'jpeg');
  console.log('  generateFlyer OK — output:', outputPath, meta.width + 'x' + meta.height);

  console.log('\nALL CORE LOGIC TESTS PASSED');
}

main().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
