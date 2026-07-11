import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Trash2, Pencil, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { listPosts, deletePost, type PostItem } from "@/api/posts";
import { formatDate } from "@/lib/utils";

export function Posts() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "draft" | "published">("all");

  const queryParams: { q?: string; status?: "draft" | "published" } = {};
  if (q) queryParams.q = q;
  if (status !== "all") queryParams.status = status;

  const { data, isLoading } = useQuery({
    queryKey: ["posts", queryParams],
    queryFn: () => listPosts({ pageSize: 50, ...queryParams }),
  });

  const del = useMutation({
    mutationFn: (id: number) => deletePost(id),
    onSuccess: () => {
      toast.success("Post dihapus");
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Posts"
        description="Blog posts — drafting, publishing, dan management."
        action={
          <Link to="/posts/new">
            <Button>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Buat Post
            </Button>
          </Link>
        }
      />

      <Card className="p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-slate-600" htmlFor="q">
              Cari judul/excerpt
            </label>
            <Input
              id="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="mis. introduction"
            />
          </div>
          <div>
            <label
              className="text-xs font-medium text-slate-600"
              htmlFor="status"
            >
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="block rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="all">Semua</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wide">
              <th className="px-4 py-3">Judul</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Update</th>
              <th className="px-4 py-3 w-28">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={5}>
                  Memuat…
                </td>
              </tr>
            )}
            {!isLoading && data && data.items.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={5}>
                  Belum ada post.
                </td>
              </tr>
            )}
            {data?.items.map((p: PostItem) => (
              <tr
                key={p.id}
                className="border-b border-slate-100 last:border-0"
              >
                <td className="px-4 py-3">
                  <Link
                    to={`/posts/${p.id}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {p.title}
                  </Link>
                  <div className="text-xs text-slate-500">/{p.slug}</div>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={p.status === "published" ? "green" : "gray"}>
                    {p.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {p.categories?.map((c) => c.category.name).join(", ") || "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatDate(p.updatedAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link to={`/posts/${p.id}`} aria-label="Edit">
                      <Button variant="secondary" className="px-2 py-1">
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </Link>
                    <Button
                      variant="danger"
                      className="px-2 py-1"
                      onClick={() => {
                        if (confirm(`Hapus "${p.title}"?`)) del.mutate(p.id);
                      }}
                      aria-label="Hapus"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
