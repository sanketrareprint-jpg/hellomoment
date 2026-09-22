export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO date
  readTime: string;
  category: string;
  /**
   * Simple markdown-ish body: each string is one block. A block starting
   * with "## " renders as a subheading, one starting with "- " starts a
   * bullet list item, everything else is a paragraph. Kept this minimal
   * on purpose instead of pulling in an MDX pipeline for a handful of posts.
   */
  content: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'automated-whatsapp-birthday-wishes-repeat-business',
    title: 'How Automated Birthday Wishes on WhatsApp Bring Customers Back',
    description:
      'A birthday or anniversary message is one of the few marketing touches customers actually look forward to. Here’s why it works, and how to do it without manual effort.',
    date: '2026-08-05',
    readTime: '4 min read',
    category: 'Customer retention',
    content: [
      'Most marketing messages get ignored. A birthday wish doesn’t — it lands on a day the customer is already thinking about themselves, and a message that shows you remembered feels personal even when it was sent automatically.',
      'For small businesses — salons, clinics, boutiques, showrooms — this is one of the cheapest ways to stay top of mind between visits. A customer who gets a warm, branded wish on their birthday is far more likely to walk back through your door than one who never hears from you outside a transaction.',
      '## Why WhatsApp specifically',
      'Open rates on WhatsApp dwarf SMS and email — most messages are read within minutes. There’s no spam folder to get lost in, and because the message includes your logo, number and address, it doubles as a gentle reminder of how to reach you.',
      '## The problem with doing it manually',
      'Tracking birthdays and anniversaries for even a few hundred customers in a spreadsheet is realistic for about a week before it quietly stops happening. Someone has to remember to check the list every single day, design a flyer, personalize it, and send it — and the first busy week is when it slips.',
      '## What automation changes',
      '- You add each customer once — name, WhatsApp number, date of birth or anniversary, and optionally a photo.',
      '- You design a flyer for birthdays, anniversaries, and any festivals you care about, just once.',
      '- Every day, the right message goes out automatically to whoever is celebrating — with their name, date and photo filled in, and your logo, phone number and address on it.',
      'That’s the whole idea behind raregreet.com: set it up once, and every customer gets remembered on the day that matters to them, without anyone on your team having to think about it again.',
    ],
  },
  {
    slug: 'festival-marketing-ideas-small-business-india',
    title: 'Festival Marketing Ideas for Small Businesses in India',
    description:
      'Diwali, Holi, Eid, New Year — festivals are natural moments for a business to reach out. Here’s how to make the most of them without extra work each time.',
    date: '2026-08-19',
    readTime: '5 min read',
    category: 'Marketing',
    content: [
      'India’s festival calendar gives every business a dozen or more natural reasons to reach out to customers each year — Diwali, Holi, Eid, Raksha Bandhan, New Year, and local or regional festivals specific to your customers’ community. Each one is an opportunity to be remembered, not just to sell.',
      '## Keep the message warm, not salesy',
      'A festival wish that leads with a discount code reads like an ad. One that simply wishes the customer well, with your branding quietly present, reads like a business that genuinely cares — and it’s that impression that brings people back when they do need what you sell.',
      '## Plan your designs once, well before the festival',
      'The businesses that do this well aren’t scrambling on the morning of Diwali. They’ve designed a flyer for each major festival ahead of time, so when the day arrives, the only thing left to happen is the send.',
      '## Automate the calendar, not just the design',
      '- Set up each festival once with its date — including festivals that shift every year on the lunar calendar.',
      '- Attach a flyer design to each festival, with your logo, contact details and products/services placed automatically.',
      '- Let sends go out on the day itself, to every customer, without anyone needing to remember the date.',
      'raregreet.com ships with starter designs for the major Indian festivals already built in, so you can get a festival campaign live in minutes rather than designing from scratch every season.',
    ],
  },
  {
    slug: 'why-whatsapp-best-channel-customer-greetings',
    title: 'Why WhatsApp Is the Best Channel for Customer Greetings',
    description:
      'Compared to SMS, email and app notifications, WhatsApp is where your customers actually are — and where a personal message still feels personal.',
    date: '2026-09-02',
    readTime: '3 min read',
    category: 'WhatsApp',
    content: [
      'If you had to pick one channel to send a birthday or festival greeting that a customer would actually see, it would be WhatsApp. It’s installed on almost every phone in India, checked constantly through the day, and — unlike SMS — a message there can carry a real flyer image, not just plain text.',
      '## It feels like it came from a person',
      'When a greeting is sent from your own WhatsApp Business number, it shows up in the same place a message from a friend or family member would. That context alone makes it land differently than a marketing email ever could.',
      '## It works even for customers who don’t use email',
      'A large share of small-business customers in India — especially outside metro cities — check WhatsApp far more reliably than email. Building your customer outreach around WhatsApp means you’re not leaving out the customers who matter just as much.',
      '## What this means in practice',
      'Building relationships doesn’t require a big marketing budget or a dedicated social media manager — it requires showing up, reliably, on the days your customers care about, through the channel they’re already checking. That’s the entire premise raregreet.com is built on: real WhatsApp sends, from your own number, on autopilot.',
    ],
  },
];

export function getAllBlogPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
