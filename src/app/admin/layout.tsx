import { requireAdmin } from "@/lib/admin";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return <AdminShell email={admin.email}>{children}</AdminShell>;
}
