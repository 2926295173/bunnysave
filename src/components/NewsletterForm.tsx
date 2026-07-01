"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setState("err");
      setMsg("请输入有效邮箱");
      return;
    }
    setState("loading");
    setMsg("");
    try {
      const r = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.message ?? "订阅失败");
      setEmail("");
      setState("ok");
      setMsg("订阅成功！明天就能收到第一封精选");
    } catch (err) {
      setState("err");
      setMsg(err instanceof Error ? err.message : "订阅失败");
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-gray-100 bg-white p-6 card-shadow" aria-label="订阅每日优惠">
      <p className="text-lg font-semibold text-gray-800">每天 3 分钟，看完今日最值得入手的优惠</p>
      <p className="mt-1 text-sm text-gray-500">无广告、无追踪退订，可以随时取消订阅。</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          aria-label="邮箱地址"
          className="flex-1 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:border-[#F97316]"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="rounded-full bg-[#F97316] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
        >
          {state === "loading" ? "订阅中…" : "免费订阅"}
        </button>
      </div>
      {msg ? (
        <p
          role={state === "err" ? "alert" : "status"}
          className={
            "mt-2 text-xs " + (state === "err" ? "text-red-600" : "text-emerald-600")
          }
        >
          {msg}
        </p>
      ) : null}
    </form>
  );
}
