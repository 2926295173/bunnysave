"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { IconX, IconPlus } from "@/components/admin/AdminIcons";

export function CoverLightbox({
  src,
  alt,
  sizes,
}: {
  src: string;
  alt: string;
  sizes: string;
}) {
  const [open, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setZoomed(false);
      }
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="点击查看大图"
        className="group relative aspect-square w-full overflow-hidden rounded-lg border border-gray-100 bg-gray-50 text-left"
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority
          sizes={sizes}
          className="object-contain p-4 transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
          <span className="rounded-full bg-black/50 px-3 py-1 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
            Click to enlarge
          </span>
        </div>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={() => {
            setOpen(false);
            setZoomed(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              setZoomed(false);
            }}
            aria-label="关闭"
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <IconX className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoomed((z) => !z);
            }}
            aria-label={zoomed ? "缩小" : "放大"}
            className="absolute right-16 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            title="切换缩放"
          >
            <IconPlus className="h-6 w-6" />
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex items-center justify-center max-h-full max-w-full"
          >
            {/* Fitted container — preserves the image's native aspect ratio,
                centered in the viewport. Clicking the image toggles zoom. */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                setZoomed((z) => !z);
              }}
              className={
                "relative max-h-[85vh] max-w-[90vw] overflow-auto rounded-lg bg-white shadow-2xl " +
                (zoomed
                  ? "cursor-zoom-out"
                  : "cursor-zoom-in")
              }
            >
              <Image
                src={src}
                alt={alt}
                width={1600}
                height={1600}
                sizes="(max-width: 1600px) 100vw, 1600px"
                className={
                  "block h-auto w-auto " +
                  (zoomed
                    ? "max-w-none"
                    : "max-h-[85vh] max-w-[90vw] object-contain")
                }
                priority
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
