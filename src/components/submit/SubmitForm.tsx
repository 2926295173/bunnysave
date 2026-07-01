"use client";

import { useState } from "react";

type State = "idle" | "submitting" | "ok" | "err";

export function SubmitForm() {
  const [state, setState] = useState<State>("idle");
  const [msg, setMsg] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [image, setImage] = useState("");
  const [price, setPrice] = useState("");
  const [store, setStore] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !url) {
      setState("err");
      setMsg("请填写优惠标题和详情链接");
      return;
    }
    setState("submitting");
    setMsg("");
    try {
      const r = await fetch("/api/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, url, image, price, store, email, notes }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.message ?? "提交失败");
      setState("ok");
      setMsg("已收到！编辑会在 24 小时内审核，通过后立即上线。");
      // reset
      setTitle(""); setUrl(""); setImage(""); setPrice(""); setStore(""); setNotes("");
    } catch (err) {
      setState("err");
      setMsg(err instanceof Error ? err.message : "提交失败，请稍后再试");
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8 space-y-4"
      aria-label="分享优惠表单"
    >
      <Field label="优惠标题" required>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例如：Amazon $5 off 任意 $25 订单（优惠码 WELCOME5）"
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-[#F97316] focus:bg-white focus:ring-2 focus:ring-[#F97316]/20"
        />
      </Field>

      <Field label="详情链接（商家页面）" required>
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.example.com/deal/..."
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-[#F97316] focus:bg-white focus:ring-2 focus:ring-[#F97316]/20"
        />
      </Field>

      <Field label="封面图 URL（可选）">
        <input
          type="url"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="https://... (16:10 横图)"
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-[#F97316] focus:bg-white focus:ring-2 focus:ring-[#F97316]/20"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="商家 / 品牌">
          <input
            type="text"
            value={store}
            onChange={(e) => setStore(e.target.value)}
            placeholder="Amazon / Walmart / ..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-[#F97316] focus:bg-white focus:ring-2 focus:ring-[#F97316]/20"
          />
        </Field>
        <Field label="价格 / 折扣">
          <input
            type="text"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="$19.99 / -30% / 免费"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-[#F97316] focus:bg-white focus:ring-2 focus:ring-[#F97316]/20"
          />
        </Field>
      </div>

      <Field label="联系邮箱（可选）">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="如果有进一步信息我们联系您"
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-[#F97316] focus:bg-white focus:ring-2 focus:ring-[#F97316]/20"
        />
      </Field>

      <Field label="备注（有效期、优惠码、条款等）">
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="例如：仅限新用户，截止 7/6 11:59 PM PT..."
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-[#F97316] focus:bg-white focus:ring-2 focus:ring-[#F97316]/20"
        />
      </Field>

      <button
        type="submit"
        disabled={state === "submitting"}
        className="w-full rounded-full gradient-brand px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
      >
        {state === "submitting" ? "提交中…" : "提交优惠"}
      </button>

      {msg ? (
        <p
          role={state === "err" ? "alert" : "status"}
          className={
            "text-center text-xs " + (state === "err" ? "text-red-600" : "text-emerald-600")
          }
        >
          {msg}
        </p>
      ) : null}
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-bunny-muted">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
