import { requireAdmin } from "@/lib/admin";
import { getBrands, getCategories } from "@/lib/deals";
import { DealForm, EMPTY_DEAL } from "@/components/admin/DealForm";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "新建优惠 | 省钱兔 Admin", robots: { index: false } };

export default async function NewDealPage() {
  await requireAdmin();
  const [brands, categories] = await Promise.all([getBrands(), getCategories()]);

  return (
    <div className="space-y-4">
      <nav className="text-sm text-gray-500">
        <Link href="/admin" className="hover:text-[#F97316]">仪表盘</Link>
        <span className="mx-2">/</span>
        <Link href="/admin/deals" className="hover:text-[#F97316]">优惠</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-800">新建</span>
      </nav>
      <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">新建优惠</h1>
      <DealForm
        mode="create"
        initial={{
          ...EMPTY_DEAL,
          id: crypto.randomUUID().replace(/-/g, ""),
        }}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
        categories={categories.map((c) => ({ slug: c.slug, label: c.label }))}
      />
    </div>
  );
}
