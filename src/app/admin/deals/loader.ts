import "server-only";
import { fetchAll } from "@/lib/db";

export type DealRow = {
  id: string;
  title: string;
  cover: string;
  brand_name: string | null;
  source: string;
  is_free: boolean;
  is_hot: boolean;
  heat: number;
  published_at: number;
};

export async function loadRows(q: string | undefined): Promise<DealRow[]> {
  const sql =
    "SELECT d.id, d.title, d.cover, d.is_free, d.is_hot, d.heat, d.published_at::BIGINT AS published_at, d.source, b.name AS brand_name " +
    "FROM deals d LEFT JOIN brands b ON b.id = d.brand_id " +
    (q ? "WHERE d.title ILIKE $1 OR b.name ILIKE $1 " : "") +
    "ORDER BY d.published_at DESC LIMIT 200";
  return q
    ? fetchAll<DealRow>(sql, [`%${q}%`])
    : fetchAll<DealRow>(sql);
}
