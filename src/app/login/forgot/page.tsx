import type { Metadata } from "next";
import Link from "next/link";
import { ForgotForm } from "@/components/auth/ForgotForm";

export const metadata: Metadata = {
  title: "忘记密码 | 省钱兔",
  description: "通过邮件重置密码链接",
  robots: { index: false, follow: false },
};

export default function ForgotPage() {
  return (
    <div className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-12 md:py-20 overflow-hidden">
      <div aria-hidden="true" className="absolute top-1/4 -left-20 w-72 h-72 bg-orange-200/30 rounded-full blur-3xl" />
      <div aria-hidden="true" className="absolute bottom-1/4 -right-20 w-72 h-72 bg-amber-200/30 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-3xl card-shadow border border-gray-100 overflow-hidden">
          <div className="px-6 pt-8 pb-2 text-center">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand text-white text-xl font-extrabold shadow-md">
              B
            </div>
            <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">忘记密码</h1>
            <p className="mt-1.5 text-sm text-gray-500">
              输入您注册时使用的邮箱，我们会发送一个重置链接给您。
            </p>
          </div>

          <ForgotForm />

          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 text-center">
            <Link href="/login" className="text-sm font-semibold gradient-brand-text hover:opacity-80">
              ← 返回登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
