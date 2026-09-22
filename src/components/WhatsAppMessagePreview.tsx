/**
 * A WhatsApp-style bubble showing how a message template reads when it goes
 * out with a flyer: an image header (where the flyer goes) above the text.
 * Used on the dashboard overview for each occasion's selected template.
 */
export default function WhatsAppMessagePreview({
  occasionLabel,
  templateName,
  text,
  isDefault,
}: {
  occasionLabel: string;
  templateName: string;
  text: string;
  isDefault: boolean;
}) {
  return (
    <div className="card p-3 flex flex-col">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="text-xs text-gray-500">{occasionLabel}</div>
          <div className="text-sm font-semibold text-gray-900 truncate">{templateName}</div>
        </div>
        <span
          className={
            'text-[10px] font-semibold uppercase rounded px-1.5 py-0.5 whitespace-nowrap ' +
            (isDefault ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700')
          }
        >
          {isDefault ? 'Default' : 'Selected'}
        </span>
      </div>

      <div className="relative flex-1 rounded-xl bg-[#efeae2] p-3">
        <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-[#25d366] flex items-center justify-center shadow">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white" aria-hidden>
            <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.2.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z" />
          </svg>
        </span>
        <div className="rounded-lg bg-white shadow-sm p-2">
          <div className="h-24 rounded-md bg-amber-50 flex items-center justify-center mb-2">
            <svg viewBox="0 0 24 24" className="w-9 h-9 text-amber-400" fill="currentColor" aria-hidden>
              <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm0 13h16l-5-6-4 4.5-2.5-2.5L4 17zm4-8.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
            </svg>
          </div>
          <p className="text-[13px] leading-relaxed text-gray-800 whitespace-pre-wrap break-words">{text}</p>
        </div>
      </div>
    </div>
  );
}
