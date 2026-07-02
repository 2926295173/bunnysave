import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin, recordAudit } from "@/lib/admin";
import { exec, fetchOne } from "@/lib/db";
import { SubmissionActions } from "@/components/admin/SubmissionActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "投稿详情 | 省钱兔 Admin", robots: { index: false } };

type Params = { id: string };
type Status = "pending" | "approved" | "rejected" | "spam";

type Row = {
  id: string;
  title: string;
  url: string;
  description: string | null;
  submitter_email: string | null;
  status: Status;
  created_at: number;
  reviewed_at: number | null;
};

function fmt(epoch: number | null): string {
  if (!epoch) return "—";
  const d = new Date(epoch * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default async function SubmissionDetailPage({ params }: { params: Promise<Params> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const row = await fetchOne<Row>(
    "SELECT id, title, url, description, submitter_email, status, created_at::BIGINT AS created_at, reviewed_at::BIGINT AS reviewed_at FROM deal_submissions WHERE id = $1",
    [id],
  );
  if (!row) notFound();

  return (
    <div className="space-y-4">
      <nav className="text-sm text-gray-500">
        <Link href="/admin" className="hover:text-[#F97316]">仪表盘</Link>
        <span className="mx-2">/</span>
        <Link href="/admin/submissions" className="hover:text-[#F97316]">投稿</Link>
        <span className="mx-2">/</span>
        <span className="line-clamp-1 text-gray-800">{row.title}</span>
      </nav>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-bold text-gray-900">{row.title}</h1>
        <dl className="mt-4 space-y-2 text-sm">
          <Row label="详情链接">
            <a
              href={row.url}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-[#F97316] hover:underline"
            >
              {row.url}
            </a>
          </Row>
          <Row label="提交人">{row.submitter_email ?? "匿名"}</Row>
          <Row label="提交时间">{fmt(row.created_at)}</Row>
          <Row label="状态">
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
              {row.status}
            </span>
          </Row>
        </dl>
        {row.description ? (
          <div className="mt-4 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
            {row.description}
          </div>
        ) : null}
      </section>

      <SubmissionActions
        submissionId={row.id}
        title={row.title}
        url={row.url}
        currentStatus={row.status}
        adminId={admin.id}
      />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-20 flex-shrink-0 text-gray-500">{label}</dt>
      <dd className="text-gray-800">{children}</dd>
    </div>
  );
}
