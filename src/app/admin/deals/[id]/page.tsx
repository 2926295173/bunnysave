import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { fetchAll, fetchOne } from "@/lib/db";
import { getBrands, getCategories } from "@/lib/deals";
import { DealForm, type DealFormValues } from "@/components/admin/DealForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "编辑优惠 | 省钱兔 Admin", robots: { index: false } };

type Params = { id: string };

export default async function EditDealPage({ params }: { params: Promise<Params> }) {
  await requireAdmin();
  const { id } = await params;
  const [row, brands, categories, links] = await Promise.all([
    fetchOne<{
      id: string;
      title: string;
      cover: string;
      brand_id: string | null;
      cta: string | null;
      source: string;
      price: string | null;
      discount: string | null;
      description: string | null;
      is_free: boolean;
      is_hot: boolean;
      heat: number;
    }>(
      "SELECT id, title, cover, brand_id, cta, source, price, discount, description, is_free, is_hot, heat FROM deals WHERE id = $1",
      [id],
    ),
    getBrands(),
    getCategories(),
    fetchAll<{ category_slug: string }>(
      "SELECT category_slug FROM deal_categories WHERE deal_id = $1",
      [id],
    ),
  ]);
  if (!row) notFound();

  const initial: DealFormValues = {
    id: row.id,
    title: row.title,
    cover: row.cover,
    brand_id: row.brand_id,
    cta: row.cta,
    source: row.source,
    price: row.price,
    discount: row.discount,
    description: row.description,
    is_free: row.is_free,
    is_hot: row.is_hot,
    heat: row.heat,
    categories: links.map((l) => l.category_slug),
  };

  return (
    <div className="space-y-4">
      <nav className="text-sm text-gray-500">
        <Link href="/admin" className="hover:text-[#F97316]">仪表盘</Link>
        <span className="mx-2">/</span>
        <Link href="/admin/deals" className="hover:text-[#F97316]">优惠</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-800 line-clamp-1">{row.title}</span>
      </nav>
      <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 line-clamp-2">编辑优惠</h1>
      <DealForm
        mode="edit"
        initial={initial}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
        categories={categories.map((c) => ({ slug: c.slug, label: c.label }))}
      />
    </div>
  );
}
