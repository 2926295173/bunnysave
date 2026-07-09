"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  dealId: string;
  dealTitle: string;
  /** Whether the current viewer has already favorited this deal. */
  initialFavorited: boolean;
  /** Whether the viewer is signed in. When false, clicking favorite redirects to login. */
  signedIn: boolean;
  /** Where to send an unauthenticated user who clicks the favorite button. */
  loginUrl: string;
};

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
      <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
    </svg>
  );
}

function BookmarkIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 17H7A5 5 0 0 1 7 7h2" />
      <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
      <line x1="8" x2="16" y1="12" y2="12" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01z" />
    </svg>
  );
}

function RedditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  );
}

type Toast = { kind: "ok" | "err"; text: string } | null;

export function DealShareAndFavorite({
  dealId,
  dealTitle,
  initialFavorited,
  signedIn,
  loginUrl,
}: Props) {
  const router = useRouter();
  const [shareOpen, setShareOpen] = useState(false);
  const [favorited, setFavorited] = useState(initialFavorited);
  const [favoritePending, setFavoritePending] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const shareWrapRef = useRef<HTMLDivElement | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(t: Toast) {
    setToast(t);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    if (t) {
      toastTimer.current = setTimeout(() => setToast(null), 2400);
    }
  }

  // Close share popup on outside click / Escape — keeps the button usable with
  // keyboard only, matching the bunnysave.com reference.
  useEffect(() => {
    if (!shareOpen) return;
    function onDown(e: MouseEvent) {
      if (!shareWrapRef.current) return;
      if (!shareWrapRef.current.contains(e.target as Node)) setShareOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShareOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [shareOpen]);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  async function onToggleFavorite() {
    if (!signedIn) {
      router.push(loginUrl);
      return;
    }
    if (favoritePending) return;
    // Optimistic update so the icon snaps immediately even on slow networks.
    const next = !favorited;
    setFavorited(next);
    setFavoritePending(true);
    try {
      const r = await fetch("/api/favorites", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dealId, action: "toggle" }),
      });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; favorited?: boolean; message?: string };
      if (!r.ok || !d.ok) {
        // Revert on failure (401 → bounce to login).
        setFavorited(!next);
        if (r.status === 401) {
          router.push(loginUrl);
          return;
        }
        showToast({ kind: "err", text: d.message ?? "收藏失败" });
        return;
      }
      setFavorited(typeof d.favorited === "boolean" ? d.favorited : next);
      showToast({ kind: "ok", text: d.favorited ? "已收藏" : "已取消收藏" });
    } catch (err) {
      setFavorited(!next);
      showToast({ kind: "err", text: (err as Error).message || "网络错误" });
    } finally {
      setFavoritePending(false);
    }
  }

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const encodedUrl = encodeURIComponent(pageUrl);
  const encodedTitle = encodeURIComponent(dealTitle);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl);
      showToast({ kind: "ok", text: "链接已复制" });
    } catch {
      // Fallback for older browsers / insecure contexts.
      try {
        const ta = document.createElement("textarea");
        ta.value = pageUrl;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        showToast({ kind: "ok", text: "链接已复制" });
      } catch {
        showToast({ kind: "err", text: "复制失败，请手动复制" });
      }
    }
    setShareOpen(false);
  }

  function shareOn(scheme: "x" | "facebook" | "reddit") {
    let url = "";
    if (scheme === "x") {
      url = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
    } else if (scheme === "facebook") {
      url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    } else {
      url = `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
    }
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=600");
    setShareOpen(false);
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <div ref={shareWrapRef} className="relative">
          <button
            type="button"
            title="分享"
            aria-label="分享"
            aria-expanded={shareOpen}
            aria-haspopup="menu"
            onClick={() => setShareOpen((v) => !v)}
            className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <ShareIcon className="h-5 w-5 text-gray-500" />
          </button>
          {shareOpen ? (
            <>
              {/* Click-catcher so clicks outside the popup close it. */}
              <div className="fixed inset-0 z-10" onClick={() => setShareOpen(false)} />
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={copyLink}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <LinkIcon className="h-4 w-4" />
                  复制链接
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => shareOn("x")}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <XIcon className="h-4 w-4" />
                  Twitter / X
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => shareOn("facebook")}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <FacebookIcon className="h-4 w-4" />
                  Facebook
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => shareOn("reddit")}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <RedditIcon className="h-4 w-4" />
                  Reddit
                </button>
              </div>
            </>
          ) : null}
        </div>
        <button
          type="button"
          title={favorited ? "取消收藏" : "收藏此优惠"}
          aria-label={favorited ? "取消收藏" : "收藏此优惠"}
          aria-pressed={favorited}
          onClick={onToggleFavorite}
          disabled={favoritePending}
          className={
            "p-3 rounded-lg border transition-colors disabled:opacity-60 " +
            (favorited
              ? "border-[#F97316] bg-orange-50 text-[#F97316] hover:bg-orange-100"
              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-500")
          }
        >
          <BookmarkIcon className="h-5 w-5" filled={favorited} />
        </button>
      </div>

      {/* Lightweight toast — no third-party dependency, matches the brand palette. */}
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full px-4 py-2 text-sm shadow-lg bg-gray-900 text-white"
        >
          {toast.text}
        </div>
      ) : null}
    </>
  );
}