export function MobileCtaBar({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 md:hidden z-40 bg-white/95 backdrop-blur-xl border-t border-gray-100 overflow-hidden"
      style={{ boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.08)" }}
    >
      <div className="flex items-center gap-3 p-3 max-w-full">
        <div className="flex-shrink-0 min-w-0" />
        <a
          className="flex-1 min-w-0"
          href={href}
          rel="sponsored nofollow noopener noreferrer"
          target="_blank"
        >
          <button
            className="w-full text-sm py-3.5 text-white font-semibold rounded-xl truncate transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #F97316, #EA580C)" }}
          >
            {label}
          </button>
        </a>
      </div>
    </div>
  );
}
