import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { getArticleAdmin } from "@/lib/articles";
import { ArticleForm, type ArticleFormValues } from "@/components/admin/ArticleForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "编辑文章 | 省钱兔 Admin", robots: { index: false } };

type Params = { slug: string };

export default async function EditArticlePage({ params }: { params: Promise<Params> }) {
  await requireAdmin();
  const { slug } = await params;
  const row = await getArticleAdmin(slug);
  if (!row) notFound();

  const initial: ArticleFormValues = {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    cover: row.cover,
    tags: row.tags,
    body: row.body,
    status: row.status === "draft" ? "draft" : "published",
    published_at: row.published_at,
  };

  return (
    <div className="space-y-4">
      <nav className="text-sm text-gray-500">
        <Link href="/admin" className="hover:text-[#F97316]">仪表盘</Link>
        <span className="mx-2">/</span>
        <Link href="/admin/articles" className="hover:text-[#F97316]">文章</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-800 line-clamp-1">{row.title}</span>
      </nav>
      <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">编辑文章</h1>
      <ArticleForm mode="edit" initial={initial} />
    </div>
  );
}
