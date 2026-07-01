"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

type Mode = "login" | "signup";

interface Props {
  mode: Mode;
}

export function AuthPage({ mode }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const urlError = params.get("error");
  const callbackUrl = params.get("callbackUrl") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [stage, setStage] = useState<"credentials" | "magic">("credentials");
  const [state, setState] = useState<"idle" | "submitting" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");

  const isLogin = mode === "login";

  if (urlError === "invalid_or_expired") {
    setMsgFn(setMsg, "登录链接无效或已过期，请重新申请");
  } else if (urlError === "missing_token") {
    setMsgFn(setMsg, "链接不完整，请重新申请");
  }
  function setMsgFn(s: typeof setMsg, m: string) { s(m); setState("err"); }

  async function signInWithGoogle() {
    setState("submitting");
    setMsg("");
    try {
      await signIn("google", { callbackUrl });
    } catch (e) {
      setState("err");
      setMsg(e instanceof Error ? e.message : "Google 登录失败");
    }
  }

  async function submitCredentials(e: FormEvent) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setState("err");
      setMsg("请输入有效邮箱");
      return;
    }
    if (password.length < 8) {
      setState("err");
      setMsg("密码至少需要 8 位");
      return;
    }
    setState("submitting");
    setMsg("");

    if (!isLogin) {
      // Sign up first, then sign in
      try {
        const r = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        const data = await r.json();
        if (!r.ok || !data.ok) throw new Error(data.message ?? "注册失败");
      } catch (err) {
        setState("err");
        setMsg(err instanceof Error ? err.message : "注册失败");
        return;
      }
    }

    const r = (await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    })) as { error?: string; ok?: boolean } | undefined;
    if (!r || r.error || !r.ok) {
      setState("err");
      setMsg(isLogin ? "邮箱或密码错误" : "登录失败，请稍后再试");
      return;
    }
    setState("ok");
    setMsg(isLogin ? "登录成功，正在跳转…" : "注册成功，正在跳转…");
    router.push(callbackUrl);
    router.refresh();
  }

  async function submitMagic(e: FormEvent) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setState("err");
      setMsg("请输入有效邮箱");
      return;
    }
    setState("submitting");
    setMsg("");
    try {
      const r = await fetch("/api/auth/magic/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await r.json();
      if (!r.ok || !data.ok) throw new Error(data.message ?? "发送失败");
      setState("ok");
      setMsg(`登录链接已发送到 ${email}，请查收邮箱。链接 15 分钟内有效。`);
    } catch (err) {
      setState("err");
      setMsg(err instanceof Error ? err.message : "发送失败");
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-12 md:py-20 overflow-hidden">
      <div aria-hidden="true" className="absolute top-1/4 -left-20 w-72 h-72 bg-orange-200/30 rounded-full blur-3xl" />
      <div aria-hidden="true" className="absolute bottom-1/4 -right-20 w-72 h-72 bg-amber-200/30 rounded-full blur-3xl" />

      <div className="hidden md:block absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-8 md:left-12 animate-float-slow">
          <DecorBadge bg="from-orange-100 to-orange-50" rotate="rotate-12">
            <TagIcon className="w-5 h-5 md:w-7 md:h-7 text-orange-500 -rotate-12" />
          </DecorBadge>
        </div>
        <div className="absolute top-32 right-4 md:right-20 animate-float-medium">
          <DecorBadge bg="from-amber-100 to-amber-50" rotate="-rotate-6">
            <span className="text-lg md:text-xl -rotate-6">%</span>
          </DecorBadge>
        </div>
        <div className="absolute bottom-40 left-4 md:left-16 animate-float-fast">
          <DecorBadge bg="from-rose-100 to-rose-50" rotate="rotate-45">
            <span className="text-sm md:text-base [-rotate-45deg]">$$</span>
          </DecorBadge>
        </div>
        <div className="absolute bottom-24 right-8 md:right-24 animate-float-slow">
          <DecorBadge bg="from-violet-100 to-violet-50" rotate="rotate-12">
            <span className="text-lg md:text-xl rotate-[-12deg]">★</span>
          </DecorBadge>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-3xl card-shadow border border-gray-100 overflow-hidden">
          <div className="px-6 pt-8 pb-2 text-center">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand text-white text-xl font-extrabold shadow-md">
              B
            </div>
            <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">
              {isLogin ? "欢迎回来" : "创建账号"}
            </h1>
            <p className="mt-1.5 text-sm text-gray-500">
              {isLogin
                ? "登录以保存您喜欢的优惠，同步收藏，获取个性化推荐"
                : "免费创建账号，第一时间获取每日精选优惠"}
            </p>
          </div>

          <div className="px-6 pt-4 space-y-3">
            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={state === "submitting"}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-[0.98] disabled:opacity-60"
            >
              <GoogleG className="h-5 w-5" />
              使用 Google 账号{isLogin ? "登录" : "注册"}
            </button>
            <button
              type="button"
              disabled={state === "submitting"}
              onClick={() => {
                setMsg("");
                setState("idle");
              }}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-[0.98] disabled:opacity-60"
            >
              <AppleIcon className="h-5 w-5" />
              使用 Apple 账号{isLogin ? "登录" : "注册"}
              <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-normal text-gray-500">即将推出</span>
            </button>
          </div>

          <div className="relative my-6 px-6">
            <div className="h-px w-full bg-gray-100" />
            <span className="absolute inset-x-0 -top-3 mx-auto w-fit bg-white px-3 text-xs text-gray-400 uppercase tracking-wider">
              或{isLogin ? "邮箱登录" : "邮箱注册"}
            </span>
          </div>

          <form
            onSubmit={stage === "magic" ? submitMagic : submitCredentials}
            className="px-6 pb-6 space-y-3"
          >
            {stage === "credentials" ? (
              <>
                {!isLogin ? (
                  <label className="block text-left">
                    <span className="text-xs font-medium text-gray-500">昵称（可选）</span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="您的称呼"
                      autoComplete="name"
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-[#F97316] focus:bg-white focus:ring-2 focus:ring-[#F97316]/20"
                    />
                  </label>
                ) : null}
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
                <label className="block text-left">
                  <span className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">密码</span>
                    {isLogin ? (
                      <Link href="/login/forgot" className="text-xs text-[#F97316] hover:underline">
                        忘记密码？
                      </Link>
                    ) : null}
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-[#F97316] focus:bg-white focus:ring-2 focus:ring-[#F97316]/20"
                  />
                </label>
                {isLogin ? (
                  <button
                    type="button"
                    onClick={() => { setStage("magic"); setMsg(""); setState("idle"); }}
                    className="text-xs text-[#F97316] hover:underline"
                  >
                    使用 Magic Link 登录（无密码）
                  </button>
                ) : (
                  <p className="text-xs text-gray-400">密码至少 8 位，建议字母+数字+符号</p>
                )}
              </>
            ) : (
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
                <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                  我们会发送一封登录链接到您的邮箱。点击链接即可登录，无需密码。
                </p>
                <button
                  type="button"
                  onClick={() => setStage("credentials")}
                  className="mt-3 text-xs text-gray-500 hover:text-gray-700"
                >
                  ← 返回密码登录
                </button>
              </label>
            )}

            <button
              type="submit"
              disabled={state === "submitting"}
              className="w-full rounded-xl gradient-brand px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
            >
              {state === "submitting"
                ? "处理中…"
                : stage === "magic"
                ? "发送登录链接"
                : isLogin
                ? "登录"
                : "创建账号"}
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

          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 text-center">
            <p className="text-sm text-gray-500">
              {isLogin ? (
                <>
                  还没有账号？{" "}
                  <Link href="/signup" className="font-semibold gradient-brand-text hover:opacity-80">
                    立即注册
                  </Link>
                </>
              ) : (
                <>
                  已有账号？{" "}
                  <Link href="/login" className="font-semibold gradient-brand-text hover:opacity-80">
                    立即登录
                  </Link>
                </>
              )}
            </p>
            <p className="mt-3 text-xs text-gray-400">
              继续操作即代表您同意我们的{" "}
              <Link href="/legal/terms" className="hover:text-[#F97316]">服务条款</Link>{" "}
              和{" "}
              <Link href="/legal/privacy" className="hover:text-[#F97316]">隐私政策</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DecorBadge({
  bg,
  rotate,
  children,
}: {
  bg: string;
  rotate: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        "w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br " +
        bg +
        " rounded-2xl flex items-center justify-center shadow-lg " +
        rotate
      }
    >
      {children}
    </div>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
      <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.05 12.04c-.03-3.04 2.49-4.5 2.6-4.57-1.42-2.07-3.62-2.36-4.4-2.39-1.87-.19-3.65 1.1-4.6 1.1-.95 0-2.41-1.07-3.97-1.04-2.04.03-3.92 1.18-4.97 3-2.13 3.69-.54 9.13 1.52 12.12 1.01 1.46 2.21 3.1 3.78 3.04 1.52-.06 2.09-.99 3.93-.99 1.84 0 2.36.99 3.97.96 1.64-.03 2.68-1.49 3.69-2.95 1.16-1.69 1.64-3.33 1.66-3.41-.04-.02-3.18-1.22-3.21-4.87M14.61 3.55c.84-1.02 1.41-2.44 1.25-3.85-1.21.05-2.68.81-3.55 1.83-.78.91-1.46 2.36-1.28 3.74 1.35.1 2.73-.69 3.58-1.72" />
    </svg>
  );
}

function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917" />
      <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}
