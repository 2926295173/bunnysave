"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

export type CategoryFormValues = {
  slug: string;
  label: string;
  description: string;
  sort_order: number;
  parent_slug: string | null;
};

function SubmitBtn({ isCreate }: { isCreate: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-gradient-to-br from-[#F97316] to-[#EA580C] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
    >
      {pending ? "保存中…" : isCreate ? "创建" : "保存"}
    </button>
  );
}

function DeleteBtn({ remove }: { remove: (fd: FormData) => Promise<void> }) {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="submit"
      formAction={async (fd: FormData) => {
        if (!confirm("确认删除该分类？")) return;
        setPending(true);
        try {
          await remove(fd);
        } finally {
          setPending(false);
        }
      }}
      disabled={pending}
      className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      {pending ? "删除中…" : "删除"}
    </button>
  );
}

export function CategoryForm({
  initial,
  parents,
  save,
  remove,
  isCreate,
}: {
  initial: CategoryFormValues;
  parents: { slug: string; label: string }[];
  save: (fd: FormData) => Promise<void>;
  remove: (fd: FormData) => Promise<void>;
  isCreate?: boolean;
}) {
  const [v, setV] = useState(initial);
  function patch<K extends keyof CategoryFormValues>(k: K, val: CategoryFormValues[K]) {
    setV((p) => ({ ...p, [k]: val }));
  }
  return (
    <form
      action={save}
      className="grid grid-cols-1 gap-2 md:grid-cols-5"
    >
      {isCreate ? (
        <input
          name="slug"
          value={v.slug}
          onChange={(e) => patch("slug", e.target.value)}
          placeholder="slug (例: electronics)"
          className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 font-mono text-xs outline-none focus:border-[#F97316]"
          required
        />
      ) : (
        <input type="hidden" name="slug" value={v.slug} />
      )}
      <input
        name="label"
        value={v.label}
        onChange={(e) => patch("label", e.target.value)}
        placeholder="显示名"
        className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-[#F97316]"
        required
      />
      <input
        name="description"
        value={v.description}
        onChange={(e) => patch("description", e.target.value)}
        placeholder="描述（可选）"
        className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-[#F97316]"
      />
      <select
        name="parent_slug"
        value={v.parent_slug ?? ""}
        onChange={(e) => patch("parent_slug", e.target.value || null)}
        className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-[#F97316]"
      >
        <option value="">— 顶级 —</option>
        {parents.map((p) => (
          <option key={p.slug} value={p.slug}>
            {p.label}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-2">
        <input
          name="sort_order"
          type="number"
          value={v.sort_order}
          onChange={(e) => patch("sort_order", Number(e.target.value || 0))}
          className="w-20 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-[#F97316]"
          aria-label="排序"
        />
        <SubmitBtn isCreate={!!isCreate} />
        {!isCreate ? <DeleteBtn remove={remove} /> : null}
      </div>
    </form>
  );
}
