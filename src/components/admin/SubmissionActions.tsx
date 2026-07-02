"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconCheck, IconX } from "@/components/admin/AdminIcons";

export function SubmissionActions({
  submissionId,
  title,
  url,
  currentStatus,
  adminId: _adminId,
}: {
  submissionId: string;
  title: string;
  url: string;
  currentStatus: "pending" | "approved" | "rejected" | "spam";
  adminId: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<"approve" | "reject" | "spam" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function act(action: "approve" | "reject" | "spam") {
    setPending(action);
    setErr(null);
    try {
      const r = await fetch(`/api/admin/submissions/${submissionId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.message ?? "操作失败");
      router.push("/admin/submissions");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "操作失败");
      setPending(null);
    }
  }

  async function promoteToDeal() {
    if (!confirm("将投稿内容作为草稿 deal 创建？将跳转到新建页面。")) return;
    const params = new URLSearchParams({
      title,
      cover: "",
      source: "submission",
      cta: url,
    });
    router.push(`/admin/deals/new?${params.toString()}`);
  }

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-800">操作</h2>
      <p className="mt-1 text-xs text-gray-500">当前状态：{currentStatus}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={promoteToDeal}
          className="rounded-xl bg-gradient-to-br from-[#F97316] to-[#EA580C] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90"
        >
          通过并创建 Deal
        </button>
        <button
          onClick={() => act("approve")}
          disabled={pending !== null}
          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
        >
          <IconCheck className="h-4 w-4" />
          {pending === "approve" ? "处理中…" : "仅标记通过"}
        </button>
        <button
          onClick={() => act("reject")}
          disabled={pending !== null}
          className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          <IconX className="h-4 w-4" />
          {pending === "reject" ? "处理中…" : "拒绝"}
        </button>
        <button
          onClick={() => act("spam")}
          disabled={pending !== null}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
        >
          {pending === "spam" ? "处理中…" : "标记垃圾"}
        </button>
      </div>
      {err ? <p className="mt-3 text-sm text-red-600">{err}</p> : null}
    </section>
  );
}
