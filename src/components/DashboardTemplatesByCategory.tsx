import Link from 'next/link';

const OCCASION_LABEL: Record<string, string> = {
  BIRTHDAY: 'Birthday',
  ANNIVERSARY: 'Anniversary',
  FESTIVAL: 'Festival',
};

const OCCASION_ORDER = ['BIRTHDAY', 'ANNIVERSARY', 'FESTIVAL'];

export interface DashboardTemplateRow {
  id: string;
  name: string;
  occasion: string;
  backgroundUrl: string;
  canvasWidth: number;
  canvasHeight: number;
}

// Groups the business's flyer templates by occasion and shows each group as
// its own horizontally-scrolling row (folder/category-wise), so the
// dashboard gives a quick visual sense of what's available per occasion
// without navigating into the Templates page.
export default function DashboardTemplatesByCategory({ templates }: { templates: DashboardTemplateRow[] }) {
  if (templates.length === 0) return null;

  const groups = new Map<string, DashboardTemplateRow[]>();
  for (const t of templates) {
    const list = groups.get(t.occasion) ?? [];
    list.push(t);
    groups.set(t.occasion, list);
  }

  const occasions = [...groups.keys()].sort((a, b) => {
    const ai = OCCASION_ORDER.indexOf(a);
    const bi = OCCASION_ORDER.indexOf(b);
    return (ai === -1 ? OCCASION_ORDER.length : ai) - (bi === -1 ? OCCASION_ORDER.length : bi);
  });

  return (
    <div className="space-y-6">
      {occasions.map((occasion) => (
        <div key={occasion}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-900 text-sm">{OCCASION_LABEL[occasion] ?? occasion} templates</h2>
            <Link href="/dashboard/templates" className="text-xs text-brand-600 font-medium">
              View all →
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
            {groups.get(occasion)!.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/templates/${t.id}/edit`}
                className="card overflow-hidden shrink-0 w-36 snap-start hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div
                  className="w-full bg-gray-100 flex items-center justify-center overflow-hidden"
                  style={{ aspectRatio: `${t.canvasWidth} / ${t.canvasHeight}` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.backgroundUrl} alt={t.name} className="w-full h-full object-contain" />
                </div>
                <p className="text-xs font-medium text-gray-700 truncate px-2 py-1.5">{t.name}</p>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
