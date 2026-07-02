import { requireAdmin } from "@/lib/admin";
import { BrandForm, EMPTY_BRAND } from "@/components/admin/BrandForm";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "新建商家 | 省钱兔 Admin", robots: { index: false } };

export default async function NewBrandPage() {
  await requireAdmin();
  return (
    <div className="space-y-4">
      <nav className="text-sm text-gray-500">
        <Link href="/admin" className="hover:text-[#F97316]">仪表盘</Link>
        <span className="mx-2">/</span>
        <Link href="/admin/brands" className="hover:text-[#F97316]">商家</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-800">新建</span>
      </nav>
      <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">新建商家</h1>
      <BrandForm mode="create" initial={EMPTY_BRAND} />
    </div>
  );
}
