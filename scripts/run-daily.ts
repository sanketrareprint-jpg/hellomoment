/**
 * Convenience wrapper for triggering the daily birthday/anniversary/
 * festival job from an external scheduler.
 *
 * Usage (after `npm install` and setting up your .env):
 *   npm run cron:daily
 *
 * On Railway (the documented deployment path — see README section 4), run
 * this as a second service's Cron Schedule with Custom Start Command
 * `npm run cron:daily`, no volume needed.
 *
 * Elsewhere, a typical crontab entry (runs once a day at 8:00am server time):
 *   0 8 * * * cd /path/to/hellomoment && /usr/bin/npm run cron:daily >> /var/log/hellomoment-cron.log 2>&1
 */

async function main() {
  const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('CRON_SECRET is not set in the environment. Aborting.');
    process.exit(1);
  }

  const res = await fetch(`${baseUrl}/api/cron/daily`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cronSecret}` },
  });

  const body = await res.json().catch(() => null);
  console.log(`hellomoment daily trigger — HTTP ${res.status}`);
  console.log(JSON.stringify(body, null, 2));

  if (!res.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
