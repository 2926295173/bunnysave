import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { fetchOne } from "@/lib/db";
import { BrandForm, type BrandFormValues } from "@/components/admin/BrandForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "编辑商家 | 省钱兔 Admin", robots: { index: false } };

type Params = { id: string };

export default async function EditBrandPage({ params }: { params: Promise<Params> }) {
  await requireAdmin();
  const { id } = await params;
  const row = await fetchOne<{ id: string; name: string; logo: string; sort_order: number }>(
    "SELECT id, name, logo, sort_order FROM brands WHERE id = $1",
    [id],
  );
  if (!row) notFound();

  const initial: BrandFormValues = {
    id: row.id,
    name: row.name,
    logo: row.logo,
    sort_order: row.sort_order,
  };

  return (
    <div className="space-y-4">
      <nav className="text-sm text-gray-500">
        <Link href="/admin" className="hover:text-[#F97316]">仪表盘</Link>
        <span className="mx-2">/</span>
        <Link href="/admin/brands" className="hover:text-[#F97316]">商家</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-800">{row.name}</span>
      </nav>
      <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">编辑商家</h1>
      <BrandForm mode="edit" initial={initial} />
    </div>
  );
}
