"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect, useRef, type ReactNode } from "react";
import { IconTrash, IconX } from "@/components/admin/AdminIcons";

export type BatchCategory = { slug: string; label: string };

type Action = "delete" | "addCategory" | "removeCategory" | "setFree" | "setHot" | "unsetFree" | "unsetHot";

export function BatchToolbar({
  selectedIds,
  onClear,
  categories,
}: {
  selectedIds: string[];
  onClear: () => void;
  categories: BatchCategory[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [showCatMenu, setShowCatMenu] = useState<"add" | "remove" | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const n = selectedIds.length;
  const [action, setAction] = useState<Action | null>(null);

  useEffect(() => {
    if (n === 0) setShowCatMenu(null);
  }, [n]);

  function run(action: Action, extra?: { category?: string }) {
    if (n === 0) return;
    setAction(action);
    setMsg(null);
    start(async () => {
      try {
        const r = await fetch("/api/admin/deals/batch", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ids: selectedIds, action, ...extra }),
        });
        const d = await r.json();
        if (!r.ok || !d.ok) throw new Error(d.message ?? "操作失败");
        setMsg({ kind: "ok", text: `${d.affected ?? n} 条已更新` });
        onClear();
        setShowCatMenu(null);
        router.refresh();
      } catch (e) {
        setMsg({ kind: "err", text: e instanceof Error ? e.message : "操作失败" });
      } finally {
        setAction(null);
      }
    });
  }

  function confirmDelete() {
    if (n === 0) return;
    if (!confirm(`确认删除 ${n} 条优惠？此操作不可恢复。`)) return;
    run("delete");
  }

  function pickCategory(slug: string) {
    if (showCatMenu === "add") run("addCategory", { category: slug });
    else if (showCatMenu === "remove") run("removeCategory", { category: slug });
  }

  return (
    <div className="sticky top-20 z-10 rounded-2xl border border-[#F97316]/30 bg-orange-50/80 p-3 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#F97316] px-3 py-1 text-xs font-semibold text-white shadow-sm">
          已选 {n} 条
        </span>
        <button
          type="button"
          onClick={onClear}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          <IconX className="h-3 w-3" />
          取消
        </button>
        <span className="mx-1 hidden h-5 w-px bg-gray-200 md:inline" />
        <BatchBtn
          label="标记免费"
          busy={pending && action === "setFree"}
          disabled={pending}
          onClick={() => run("setFree")}
        />
        <BatchBtn
          label="取消免费"
          busy={pending && action === "unsetFree"}
          disabled={pending}
          onClick={() => run("unsetFree")}
        />
        <BatchBtn
          label="标记热门"
          busy={pending && action === "setHot"}
          disabled={pending}
          onClick={() => run("setHot")}
        />
        <BatchBtn
          label="取消热门"
          busy={pending && action === "unsetHot"}
          disabled={pending}
          onClick={() => run("unsetHot")}
        />
        <CategoryMenu
          label="加入分类"
          variant="add"
          categories={categories}
          open={showCatMenu === "add"}
          busy={pending && action === "addCategory"}
          onOpen={() => setShowCatMenu(showCatMenu === "add" ? null : "add")}
          onClose={() => setShowCatMenu(null)}
          onPick={pickCategory}
        />
        <CategoryMenu
          label="移出分类"
          variant="remove"
          categories={categories}
          open={showCatMenu === "remove"}
          busy={pending && action === "removeCategory"}
          onOpen={() => setShowCatMenu(showCatMenu === "remove" ? null : "remove")}
          onClose={() => setShowCatMenu(null)}
          onPick={pickCategory}
        />
        <button
          type="button"
          onClick={confirmDelete}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          <IconTrash className="h-3.5 w-3.5" />
          {pending && action === "delete" ? "删除中…" : `删除 (${n})`}
        </button>
        {msg ? (
          <span
            className={
              "ml-auto text-xs " + (msg.kind === "err" ? "text-red-600" : "text-emerald-700")
            }
          >
            {msg.text}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function BatchBtn({
  label,
  busy,
  disabled,
  onClick,
}: {
  label: string;
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
    >
      {busy ? `${label}中…` : label}
    </button>
  );
}

function CategoryMenu({
  label,
  variant: _variant,
  categories,
  open,
  busy,
  onOpen,
  onClose,
  onPick,
}: {
  label: string;
  variant: "add" | "remove";
  categories: BatchCategory[];
  open: boolean;
  busy: boolean;
  onOpen: () => void;
  onClose: () => void;
  onPick: (slug: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onClose]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={onOpen}
        disabled={busy}
        className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        {busy ? `${label}中…` : label}
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-20 mt-1 w-56 max-h-72 overflow-y-auto rounded-xl border border-gray-100 bg-white py-1 shadow-xl">
          {categories.length === 0 ? (
            <p className="px-3 py-2 text-xs text-gray-400">暂无分类</p>
          ) : (
            categories.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => onPick(c.slug)}
                className="block w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                {c.label}
                <span className="ml-1 text-xs text-gray-400">/{c.slug}</span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

export function SelectAllCheckbox({
  pageIds,
  selected,
  onToggleAll,
}: {
  pageIds: string[];
  selected: Set<string>;
  onToggleAll: (next: boolean) => void;
}) {
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  return (
    <input
      type="checkbox"
      aria-label="全选当前页"
      checked={allOnPageSelected}
      onChange={(e) => onToggleAll(e.target.checked)}
      className="h-4 w-4 cursor-pointer accent-[#F97316]"
    />
  );
}

export function RowCheckbox({
  id,
  selected,
  onToggle,
}: {
  id: string;
  selected: boolean;
  onToggle: (id: string, next: boolean) => void;
}) {
  return (
    <input
      type="checkbox"
      aria-label="选择"
      checked={selected}
      onChange={(e) => onToggle(id, e.target.checked)}
      onClick={(e) => e.stopPropagation()}
      className="h-4 w-4 cursor-pointer accent-[#F97316]"
    />
  );
}

export function useBatchSelection() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  function toggle(id: string, on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }
  function setMany(ids: string[], on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }
  function clear() {
    setSelected(new Set());
  }
  return { selected, toggle, setMany, clear };
}
