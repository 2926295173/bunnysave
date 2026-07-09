"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { IconCheck, IconX, IconTrash, IconEye } from "@/components/admin/AdminIcons";

export type ArticleFormValues = {
  slug: string;
  title: string;
  excerpt: string;
  cover: string;
  tags: string[];
  body: string;
  status: "published" | "draft";
  published_at: number;
};

export const EMPTY_ARTICLE: ArticleFormValues = {
  slug: "",
  title: "",
  excerpt: "",
  cover: "",
  tags: [],
  body: "",
  status: "published",
  published_at: Math.floor(Date.now() / 1000),
};

function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^\w一-龥]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function parseTagsInput(value: string): string[] {
  return value
    .split(/[,，、\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 16);
}

function ymdToEpoch(ymd: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return Math.floor(Date.now() / 1000);
  return Math.floor(new Date(`${ymd}T00:00:00.000Z`).getTime() / 1000);
}

function epochToYmd(epoch: number): string {
  if (!epoch) return new Date().toISOString().slice(0, 10);
  return new Date(epoch * 1000).toISOString().slice(0, 10);
}

export function ArticleForm({
  initial,
  mode,
}: {
  initial: ArticleFormValues;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [tagsInput, setTagsInput] = useState(initial.tags.join(", "));
  const [publishedYmd, setPublishedYmd] = useState(epochToYmd(initial.published_at));
  const [state, setState] = useState<"idle" | "submitting" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");
  const [deleting, setDeleting] = useState(false);

  function patch<K extends keyof ArticleFormValues>(k: K, val: ArticleFormValues[K]) {
    setV((p) => ({ ...p, [k]: val }));
  }

  function onTagsInputChange(value: string) {
    setTagsInput(value);
    patch("tags", parseTagsInput(value));
  }

  function onPublishedYmdChange(value: string) {
    setPublishedYmd(value);
    patch("published_at", ymdToEpoch(value));
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
    const slug = mode === "create" ? slugify(v.slug || v.title) : v.slug;
    if (!slug) {
      setState("err");
      setMsg("无法生成 slug");
      return;
    }
    if (mode === "create" && v.slug !== slug) patch("slug", slug);

    setState("submitting");
    setMsg("");
    try {
      const url = mode === "create" ? "/api/admin/articles" : `/api/admin/articles/${v.slug}`;
      const method = mode === "create" ? "POST" : "PUT";
      const r = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...v, slug, published_at: ymdToEpoch(publishedYmd) }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.message ?? "保存失败");
      setState("ok");
      setMsg(mode === "create" ? "已创建" : "已保存");
      router.push("/admin/articles");
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
      const r = await fetch(`/api/admin/articles/${v.slug}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.message ?? "删除失败");
      router.push("/admin/articles");
      router.refresh();
    } catch (err) {
      setDeleting(false);
      alert(err instanceof Error ? err.message : "删除失败");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">
            标题 <span className="text-red-500">*</span>
          </span>
          <input
            value={v.title}
            onChange={(e) => {
              patch("title", e.target.value);
              if (mode === "create" && !v.slug) patch("slug", slugify(e.target.value));
            }}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/15"
            required
          />
        </label>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Slug</span>
            <input
              value={v.slug}
              onChange={(e) => patch("slug", slugify(e.target.value))}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/15"
              placeholder="自动从标题生成"
              disabled={mode === "edit"}
            />
            <p className="mt-1 text-[11px] text-gray-400">编辑后不可修改（外链稳定性）</p>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">发布日期</span>
            <input
              type="date"
              value={publishedYmd}
              onChange={(e) => onPublishedYmdChange(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/15"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">
            封面 URL <span className="text-red-500">*</span>
          </span>
          <input
            value={v.cover}
            onChange={(e) => patch("cover", e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/15"
            placeholder="https://... 或 /images/..."
            required
          />
          {v.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={v.cover}
              alt=""
              className="mt-2 h-32 w-full max-w-md rounded-lg border border-gray-200 object-cover"
            />
          ) : null}
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">摘要</span>
          <textarea
            value={v.excerpt}
            onChange={(e) => patch("excerpt", e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/15"
            placeholder="列表卡片与 SEO 描述会用到"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">
            标签 <span className="text-gray-400">（用 , 或 空格 分隔，最多 16 个）</span>
          </span>
          <input
            value={tagsInput}
            onChange={(e) => onTagsInputChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/15"
            placeholder="购物技巧, 省钱, 优惠"
          />
          {v.tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {v.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}
        </label>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-600">状态</span>
          <div className="flex overflow-hidden rounded-lg border border-gray-200 text-xs">
            {(["published", "draft"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => patch("status", s)}
                className={
                  "px-3 py-1.5 transition " +
                  (v.status === s
                    ? "bg-gradient-to-br from-[#F97316] to-[#EA580C] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50")
                }
              >
                {s === "published" ? "已发布" : "草稿"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">
            正文（Markdown） <span className="text-red-500">*</span>
          </span>
          <span className="text-[11px] text-gray-400">
            支持 # / ## 标题、- 或 * 列表、1. 有序列表、**粗体**、`code`、--- 分隔线
          </span>
        </div>
        <textarea
          value={v.body}
          onChange={(e) => patch("body", e.target.value)}
          rows={20}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-xs leading-relaxed outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/15"
          placeholder="## 章节标题&#10;&#10;正文内容..."
          required
        />
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
            href="/admin/articles"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <IconX className="h-4 w-4" />
            取消
          </Link>
          {mode === "edit" ? (
            <Link
              href={`/articles/${v.slug}`}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <IconEye className="h-4 w-4" />
              预览
            </Link>
          ) : null}
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
