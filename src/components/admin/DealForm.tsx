"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { IconCheck, IconX } from "@/components/admin/AdminIcons";

export type BrandOption = { id: string; name: string };
export type CategoryOption = { slug: string; label: string };

export type DealFormValues = {
  id: string;
  title: string;
  cover: string;
  brand_id: string | null;
  cta: string | null;
  source: string;
  price: string | null;
  discount: string | null;
  description: string | null;
  is_free: boolean;
  is_hot: boolean;
  heat: number;
  categories: string[];
};

export const EMPTY_DEAL: DealFormValues = {
  id: "",
  title: "",
  cover: "",
  brand_id: null,
  cta: null,
  source: "bunnysave.com",
  price: null,
  discount: null,
  description: null,
  is_free: false,
  is_hot: false,
  heat: 100,
  categories: [],
};

export function DealForm({
  initial,
  brands,
  categories,
  mode,
}: {
  initial: DealFormValues;
  brands: BrandOption[];
  categories: CategoryOption[];
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [state, setState] = useState<"idle" | "submitting" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");
  const [deleting, setDeleting] = useState(false);

  function patch<K extends keyof DealFormValues>(key: K, val: DealFormValues[K]) {
    setV((prev) => ({ ...prev, [key]: val }));
  }

  function toggleCategory(slug: string) {
    setV((prev) => ({
      ...prev,
      categories: prev.categories.includes(slug)
        ? prev.categories.filter((s) => s !== slug)
        : [...prev.categories, slug],
    }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!v.title.trim()) {
      setState("err");
      setMsg("标题不能为空");
      return;
    }
    if (!v.cover.trim()) {
      setState("err");
      setMsg("封面 URL 不能为空");
      return;
    }
    setState("submitting");
    setMsg("");
    try {
      const url = mode === "create" ? "/api/admin/deals" : `/api/admin/deals/${v.id}`;
      const method = mode === "create" ? "POST" : "PUT";
      const r = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(v),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.message ?? "保存失败");
      setState("ok");
      setMsg(mode === "create" ? "已创建" : "已保存");
      router.push("/admin/deals");
      router.refresh();
    } catch (err) {
      setState("err");
      setMsg(err instanceof Error ? err.message : "保存失败");
    }
  }

  async function onDelete() {
    if (mode !== "edit") return;
    if (!confirm(`确认删除「${v.title}」？此操作不可恢复。`)) return;
    setDeleting(true);
    try {
      const r = await fetch(`/api/admin/deals/${v.id}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.message ?? "删除失败");
      router.push("/admin/deals");
      router.refresh();
    } catch (err) {
      setDeleting(false);
      alert(err instanceof Error ? err.message : "删除失败");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Section title="基本信息">
        <Field label="标题" required>
          <input
            value={v.title}
            onChange={(e) => patch("title", e.target.value)}
            className="form-input"
            required
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="封面 URL" required hint="指向 assets.dealselected.com/deals/xxx.* 或本地 /images/...">
            <input
              value={v.cover}
              onChange={(e) => patch("cover", e.target.value)}
              className="form-input"
              required
              placeholder="https://..."
            />
            {v.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={v.cover}
                alt=""
                className="mt-2 h-24 w-24 rounded-lg border border-gray-200 object-contain"
              />
            ) : null}
          </Field>
          <Field label="商家" hint="可留空">
            <select
              value={v.brand_id ?? ""}
              onChange={(e) => patch("brand_id", e.target.value || null)}
              className="form-input"
            >
              <option value="">— 无 —</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="CTA URL" hint="点击前往按钮跳转的链接，留空走 bunnysave.com 主页">
            <input
              value={v.cta ?? ""}
              onChange={(e) => patch("cta", e.target.value || null)}
              className="form-input"
              placeholder="https://..."
            />
          </Field>
          <Field label="来源">
            <input
              value={v.source}
              onChange={(e) => patch("source", e.target.value)}
              className="form-input"
            />
          </Field>
        </div>
      </Section>

      <Section title="价格 / 折扣">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="价格 (e.g. $129.00)">
            <input
              value={v.price ?? ""}
              onChange={(e) => patch("price", e.target.value || null)}
              className="form-input"
              placeholder="$0.00"
            />
          </Field>
          <Field label="折扣 (e.g. -50%)">
            <input
              value={v.discount ?? ""}
              onChange={(e) => patch("discount", e.target.value || null)}
              className="form-input"
              placeholder="-50%"
            />
          </Field>
          <Field label="热度 heat" hint="80–500">
            <input
              type="number"
              min={0}
              max={9999}
              value={v.heat}
              onChange={(e) => patch("heat", Number(e.target.value || 0))}
              className="form-input"
            />
          </Field>
        </div>
        <div className="flex flex-wrap gap-3 pt-1">
          <Toggle
            checked={v.is_free}
            onChange={(c) => patch("is_free", c)}
            label="免费 / 超低价"
          />
          <Toggle checked={v.is_hot} onChange={(c) => patch("is_hot", c)} label="热门" />
        </div>
      </Section>

      <Section title="描述 (Markdown)">
        <textarea
          value={v.description ?? ""}
          onChange={(e) => patch("description", e.target.value || null)}
          className="form-input min-h-[200px] font-mono text-sm"
          placeholder="支持 **加粗**、- 列表、1. 有序列表、## 标题"
        />
        <p className="mt-1 text-xs text-gray-400">
          支持 Markdown：`**加粗**`、`- 列表项`、`1. 有序项`、`## 标题`、`` `code` ``
        </p>
      </Section>

      <Section title="分类">
        <p className="mb-2 text-xs text-gray-500">勾选此优惠所属的分类（多选）</p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {categories.map((c) => (
            <label
              key={c.slug}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:border-[#F97316]"
            >
              <input
                type="checkbox"
                checked={v.categories.includes(c.slug)}
                onChange={() => toggleCategory(c.slug)}
                className="h-4 w-4 accent-[#F97316]"
              />
              <span className="text-gray-700">{c.label}</span>
              <span className="ml-auto text-xs text-gray-400">/{c.slug}</span>
            </label>
          ))}
        </div>
      </Section>

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
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#F97316] to-[#EA580C] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            <IconCheck className="h-4 w-4" />
            {state === "submitting" ? "保存中…" : mode === "create" ? "创建" : "保存"}
          </button>
          <Link
            href="/admin/deals"
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
            {deleting ? "删除中…" : "删除"}
          </button>
        ) : null}
      </div>

      <style jsx>{`
        :global(.form-input) {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(229 231 235);
          background-color: white;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.15s;
        }
        :global(.form-input:focus) {
          border-color: #f97316;
          box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.15);
        }
      `}</style>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-gray-800">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-gray-400">{hint}</span> : null}
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={
        "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition " +
        (checked
          ? "border-[#F97316] bg-orange-50 text-[#F97316]"
          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50")
      }
    >
      <span
        className={
          "flex h-4 w-4 items-center justify-center rounded border " +
          (checked ? "border-[#F97316] bg-[#F97316] text-white" : "border-gray-300")
        }
      >
        {checked ? "✓" : ""}
      </span>
      {label}
    </button>
  );
}
