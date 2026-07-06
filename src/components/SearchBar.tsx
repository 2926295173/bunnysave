"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function SearchBar() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="w-[192px] focus-within:w-[256px] transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          const term = q.trim();
          if (!term) return;
          start(() => router.push(`/search?q=${encodeURIComponent(term)}`));
        }}
        className="relative"
      >
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索优惠..."
          aria-label="搜索"
          className="w-full text-[14px] rounded-full outline-none transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] placeholder:text-gray-400"
          style={{
            height: 41.67,
            padding: "10px 16px 10px 40px",
            border: "1px solid rgb(229, 231, 235)",
            background: "rgb(249, 250, 251)",
            boxShadow:
              "0 0 0 0px rgba(0,0,0,0), 0 0 0 0px rgba(0,0,0,0)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "rgb(209, 213, 219)";
            e.currentTarget.style.boxShadow =
              "0 0 0 2px rgb(251, 250, 249), 0 0 0 4px rgb(243, 244, 246)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "rgb(229, 231, 235)";
            e.currentTarget.style.boxShadow =
              "0 0 0 0px rgba(0,0,0,0), 0 0 0 0px rgba(0,0,0,0)";
          }}
        />
        {pending ? <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">…</span> : null}
      </form>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}