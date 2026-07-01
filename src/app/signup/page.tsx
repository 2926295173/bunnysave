import { Suspense } from "react";
import { AuthPage } from "@/components/auth/AuthPage";

export const metadata = {
  title: "注册 | 省钱兔",
  description: "创建免费账号，订阅每日精选优惠。",
  robots: { index: false, follow: true },
};

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <AuthPage mode="signup" />
    </Suspense>
  );
}

function AuthFallback() {
  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F97316]" />
    </div>
  );
}
