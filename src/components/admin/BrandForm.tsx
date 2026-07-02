"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { IconCheck, IconX, IconTrash } from "@/components/admin/AdminIcons";

export type BrandFormValues = { id: string; name: string; logo: string; sort_order: number };

export const EMPTY_BRAND: BrandFormValues = {
  id: "",
  name: "",
  logo: "",
  sort_order: 0,
};

function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^\w一-龥]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

export function BrandForm({
  initial,
  mode,
}: {
  initial: BrandFormValues;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [state, setState] = useState<"idle" | "submitting" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");
  const [deleting, setDeleting] = useState(false);

  function patch<K extends keyof BrandFormValues>(k: K, val: BrandFormValues[K]) {
    setV((p) => ({ ...p, [k]: val }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!v.name.trim()) {
      setState("err");
      setMsg("名称不能为空");
      return;
    }
    if (!v.logo.trim()) {
      setState("err");
      setMsg("Logo URL 不能为空");
      return;
    }
    setState("submitting");
    setMsg("");
    try {
      const id = mode === "create" ? slugify(v.id || v.name) : v.id;
      const url = mode === "create" ? "/api/admin/brands" : `/api/admin/brands/${v.id}`;
      const method = mode === "create" ? "POST" : "PUT";
      const r = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...v, id }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.message ?? "保存失败");
      setState("ok");
      setMsg(mode === "create" ? "已创建" : "已保存");
      router.push("/admin/brands");
      router.refresh();
    } catch (err) {
      setState("err");
      setMsg(err instanceof Error ? err.message : "保存失败");
    }
  }

  async function onDelete() {
    if (mode !== "edit") return;
    if (!confirm(`确认删除「${v.name}」？关联的 deal 不会删除。`)) return;
    setDeleting(true);
    try {
      const r = await fetch(`/api/admin/brands/${v.id}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.message ?? "删除失败");
      router.push("/admin/brands");
      router.refresh();
    } catch (err) {
      setDeleting(false);
      alert(err instanceof Error ? err.message : "删除失败");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-medium text-gray-600">名称 <span className="text-red-500">*</span></span>
          <input
            value={v.name}
            onChange={(e) => {
              patch("name", e.target.value);
              if (mode === "create" && !v.id) patch("id", slugify(e.target.value));
            }}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/15"
            required
          />
        </label>
        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-medium text-gray-600">ID (slug)</span>
          <input
            value={v.id}
            onChange={(e) => patch("id", e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/15"
            placeholder="自动从名称生成"
            disabled={mode === "edit"}
          />
        </label>
        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-medium text-gray-600">Logo URL <span className="text-red-500">*</span></span>
          <input
            value={v.logo}
            onChange={(e) => patch("logo", e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/15"
            placeholder="https://... 或 /images/..."
            required
          />
          {v.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={v.logo} alt="" className="mt-2 h-16 w-16 rounded-lg border border-gray-200 object-contain" />
          ) : null}
        </label>
        <label className="mb-1 block">
          <span className="mb-1 block text-xs font-medium text-gray-600">排序</span>
          <input
            type="number"
            value={v.sort_order}
            onChange={(e) => patch("sort_order", Number(e.target.value || 0))}
            className="w-32 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/15"
          />
        </label>
      </div>

      {msg ? (
        <p
          role={state === "err" ? "alert" : "status"}
          className={
            "rounded-lg px-3 py-2 text-sm " +
            (state === "err" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700")
          }
        >
          {msg}
        </p>
      ) : null}

      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={state === "submitting"}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#F97316] to-[#EA580C] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
          >
            <IconCheck className="h-4 w-4" />
            {state === "submitting" ? "保存中…" : mode === "create" ? "创建" : "保存"}
          </button>
          <Link
            href="/admin/brands"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <IconX className="h-4 w-4" />
            取消
          </Link>
        </div>
        {mode === "edit" ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <IconTrash className="h-4 w-4" />
            {deleting ? "删除中…" : "删除"}
          </button>
        ) : null}
      </div>
    </form>
  );
}
