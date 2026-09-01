/**
 * Wallet recharge tiers. A business picks one of these amounts on the
 * Wallet page; the size of the recharge decides the per-message rate they
 * get from then on (bigger top-up → cheaper per message), per the pricing
 * agreed with the platform owner: cost per WhatsApp send is ~₹2.57
 * (₹1.09 × 2 + 18% GST), so every tier below still leaves a healthy margin.
 *
 * All amounts are in paise (₹1 = 100 paise) to keep money as integers
 * throughout — no floating-point rounding on anything that touches a
 * balance.
 */
export interface RechargeTier {
  amountRupees: number;
  pricePerMessageRupees: number;
}

export const RECHARGE_TIERS: RechargeTier[] = [
  { amountRupees: 500, pricePerMessageRupees: 5 },
  { amountRupees: 2000, pricePerMessageRupees: 4.5 },
  { amountRupees: 5000, pricePerMessageRupees: 4 },
];

// TEMPORARY — lowered from 500 to 5 so a real Razorpay live-mode recharge
// can be tested for a few rupees instead of ₹500. Change this back to 500
// once testing is done — see the note in RechargeOptions.tsx too.
export const MIN_RECHARGE_RUPEES = 5;

export const DEFAULT_RATE_PAISE = Math.round(RECHARGE_TIERS[0].pricePerMessageRupees * 100);

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * The per-message rate (in paise) a recharge of this amount unlocks: the
 * rate for the highest tier the amount meets or exceeds. A business that
 * pays more than the top tier's amount still just gets the top tier's
 * rate — there's no benefit modeled past ₹5000 yet.
 */
export function rateForRechargeAmount(amountRupees: number): number {
  let rate = RECHARGE_TIERS[0].pricePerMessageRupees;
  for (const tier of RECHARGE_TIERS) {
    if (amountRupees >= tier.amountRupees) {
      rate = tier.pricePerMessageRupees;
    }
  }
  return rupeesToPaise(rate);
}
