import { Suspense } from "react";
import { AuthPage } from "@/components/auth/AuthPage";

export const metadata = {
  title: "登录 | 省钱兔",
  description: "登录以保存您喜欢的优惠，同步收藏，获取个性化推荐。",
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  const googleEnabled =
    Boolean(process.env.GOOGLE_CLIENT_ID) && Boolean(process.env.GOOGLE_CLIENT_SECRET);
  return (
    <Suspense fallback={<AuthFallback />}>
      <AuthPage mode="login" googleEnabled={googleEnabled} />
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
