// Floating "Chat on WhatsApp" button for the public (pre-login) pages —
// opens a WhatsApp chat with the sales number already used on the Contact
// page, with a pre-filled greeting so a visitor doesn't have to type one.
const SALES_WHATSAPP_NUMBER = '919270299601'; // +91 92702 99601, see src/app/contact/page.tsx
const DEFAULT_MESSAGE = "Hi! I'd like to talk to sales about raregreet.com.";

export default function WhatsAppFloatButton() {
  const href = `https://wa.me/${SALES_WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with sales on WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[#25D366] pl-3 pr-4 py-3 text-white font-medium text-sm shadow-lg hover:shadow-xl hover:brightness-105 transition-all"
    >
      <svg viewBox="0 0 32 32" className="w-6 h-6 shrink-0" fill="currentColor" aria-hidden="true">
        <path d="M16.001 3C9.373 3 4 8.373 4 15.001c0 2.386.63 4.62 1.732 6.556L4 29l7.653-1.706A11.94 11.94 0 0016.001 27C22.629 27 28 21.629 28 15.001 28 8.373 22.629 3 16.001 3zm0 21.8a9.74 9.74 0 01-4.97-1.36l-.357-.211-4.541 1.012 1.032-4.428-.234-.372A9.75 9.75 0 1125.75 15c0 5.38-4.372 9.8-9.749 9.8zm5.36-7.34c-.294-.147-1.74-.858-2.01-.956-.27-.098-.467-.147-.663.147-.196.294-.76.956-.932 1.152-.171.196-.343.22-.637.073-.294-.147-1.242-.458-2.366-1.462-.874-.78-1.464-1.744-1.635-2.038-.171-.294-.018-.453.129-.6.132-.132.294-.343.441-.514.147-.171.196-.294.294-.49.098-.196.049-.368-.024-.515-.073-.147-.663-1.6-.909-2.19-.24-.575-.483-.497-.663-.506l-.564-.01c-.196 0-.515.073-.784.368-.27.294-1.03 1.006-1.03 2.456 0 1.45 1.055 2.85 1.202 3.046.147.196 2.077 3.17 5.032 4.445.703.303 1.251.484 1.678.62.705.224 1.347.192 1.855.117.566-.084 1.74-.712 1.985-1.4.245-.688.245-1.278.172-1.4-.073-.122-.27-.196-.564-.343z" />
      </svg>
      <span className="hidden sm:inline">Chat on WhatsApp</span>
    </a>
  );
}
