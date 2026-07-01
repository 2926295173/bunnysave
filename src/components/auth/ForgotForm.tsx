"use client";

import { useState } from "react";

export function ForgotForm() {
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
    // For now we always return success (don't leak whether the email exists).
    await new Promise((r) => setTimeout(r, 600));
    setState("ok");
    setMsg(`如果 ${email} 已注册，重置链接已发送到您的邮箱（请查收）。`);
  }

  return (
    <form onSubmit={submit} className="px-6 pb-6 space-y-3">
      <label className="block text-left">
        <span className="text-xs font-medium text-gray-500">邮箱地址</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          autoComplete="email"
          className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-[#F97316] focus:bg-white focus:ring-2 focus:ring-[#F97316]/20"
        />
      </label>
      <button
        type="submit"
        disabled={state === "loading"}
        className="w-full rounded-xl gradient-brand px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
      >
        {state === "loading" ? "发送中…" : "发送重置链接"}
      </button>
      {msg ? (
        <p
          role={state === "err" ? "alert" : "status"}
          className={
            "text-center text-xs " +
            (state === "err" ? "text-red-600" : "text-emerald-600")
          }
        >
          {msg}
        </p>
      ) : null}
    </form>
  );
}
