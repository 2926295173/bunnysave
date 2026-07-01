import { Suspense } from "react";
import { AccountPanel } from "@/components/account/AccountPanel";

export const metadata = {
  title: "账户 | 省钱兔",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Suspense fallback={<div className="h-32 animate-pulse rounded-2xl bg-gray-100" />}>
        <AccountPanel />
      </Suspense>
    </div>
  );
}
