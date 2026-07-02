import { requireAdmin } from "@/lib/admin";
import { fetchAll, exec } from "@/lib/db";
import { CategoryForm, type CategoryFormValues } from "@/components/admin/CategoryForm";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
export const metadata = { title: "分类管理 | 省钱兔 Admin", robots: { index: false } };

type Row = {
  slug: string;
  label: string;
  description: string;
  sort_order: number;
  parent_slug: string | null;
};

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const rows = await fetchAll<Row>(
    "SELECT slug, label, description, sort_order, parent_slug FROM categories ORDER BY sort_order ASC, label ASC",
  );
  const parents = rows.filter((r) => !r.parent_slug);
  const childrenOf = (slug: string) => rows.filter((r) => r.parent_slug === slug);

  async function save(formData: FormData) {
    "use server";
    const slug = String(formData.get("slug") ?? "").trim();
    const label = String(formData.get("label") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const sort_order = Number(formData.get("sort_order") ?? 0);
    const parent_slug = String(formData.get("parent_slug") ?? "").trim() || null;
    if (!slug || !label) return;
    await exec(
      `INSERT INTO categories (slug, label, description, sort_order, parent_slug)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (slug) DO UPDATE SET
         label = EXCLUDED.label,
         description = EXCLUDED.description,
         sort_order = EXCLUDED.sort_order,
         parent_slug = EXCLUDED.parent_slug`,
      [slug, label, description, sort_order, parent_slug],
    );
    revalidatePath("/admin/categories");
  }

  async function remove(formData: FormData) {
    "use server";
    const slug = String(formData.get("slug") ?? "").trim();
    if (!slug) return;
    await exec("DELETE FROM categories WHERE slug = $1", [slug]);
    revalidatePath("/admin/categories");
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">分类</h1>
        <p className="text-sm text-gray-500">共 {rows.length} 个分类（{parents.length} 顶级 / {rows.length - parents.length} 子分类）</p>
      </header>

      <div className="space-y-4">
        {parents.map((p) => (
          <section key={p.slug} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <header className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">
                {p.label} <span className="text-xs font-normal text-gray-400">/{p.slug}</span>
              </h2>
              <span className="text-xs text-gray-400">{childrenOf(p.slug).length} 子分类</span>
            </header>
            <CategoryForm
              initial={rowToValues(p)}
              parents={parents.filter((x) => x.slug !== p.slug)}
              save={save}
              remove={remove}
            />
            {childrenOf(p.slug).length > 0 ? (
              <ul className="mt-3 space-y-1 border-t border-gray-100 pt-3 text-sm">
                {childrenOf(p.slug).map((c) => (
                  <li key={c.slug} className="text-gray-600">
                    <span className="text-gray-800">{c.label}</span>
                    <span className="ml-2 text-xs text-gray-400">/{c.slug}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        <section className="rounded-2xl border border-dashed border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-800">+ 新建顶级分类</h2>
          <CategoryForm
            initial={{ slug: "", label: "", description: "", sort_order: 0, parent_slug: null }}
            parents={parents}
            save={save}
            remove={remove}
            isCreate
          />
        </section>
      </div>
    </div>
  );
}

function rowToValues(r: Row): CategoryFormValues {
  return {
    slug: r.slug,
    label: r.label,
    description: r.description,
    sort_order: r.sort_order,
    parent_slug: r.parent_slug,
  };
}
