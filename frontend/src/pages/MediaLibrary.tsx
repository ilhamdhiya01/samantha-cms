import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Trash2, Copy, Upload } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { listMedia, uploadMedia, deleteMedia } from "@/api/media";
import { formatDate } from "@/lib/utils";
import { confirmDelete } from "@/lib/dialogs";

export function MediaLibrary() {
  const qc = useQueryClient();
  const [bucket, setBucket] = useState<"all" | "blog" | "projects" | "misc">(
    "all",
  );
  const [uploading, setUploading] = useState(false);

  const params: { pageSize: number; bucket?: string } = { pageSize: 60 };
  if (bucket !== "all") params.bucket = bucket;
  const { data, isLoading } = useQuery({
    queryKey: ["media", params],
    queryFn: () => listMedia(params),
  });

  const del = useMutation({
    mutationFn: (vars: { bucket: string; path: string }) =>
      deleteMedia(vars.bucket, vars.path),
    onSuccess: () => {
      toast.success("Media dihapus");
      qc.invalidateQueries({ queryKey: ["media"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      await uploadMedia(file, bucket === "all" ? undefined : bucket);
      qc.invalidateQueries({ queryKey: ["media"] });
      toast.success("Upload berhasil");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Media Library"
        description="File-file hasil upload ke Supabase Storage."
        action={
          <div className="flex items-center gap-2">
            <select
              aria-label="Filter bucket"
              value={bucket}
              onChange={(e) => setBucket(e.target.value as typeof bucket)}
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="all">Semua bucket</option>
              <option value="blog">blog</option>
              <option value="projects">projects</option>
              <option value="misc">misc</option>
            </select>
            <label className="cursor-pointer inline-flex items-center gap-1 rounded bg-brand-600 hover:bg-brand-700 text-white px-3 py-2 text-sm">
              <Upload className="h-4 w-4" aria-hidden="true" />
              {uploading ? "Uploading…" : "Upload"}
              <input
                type="file"
                hidden
                onChange={onUpload}
                disabled={uploading}
              />
            </label>
          </div>
        }
      />

      {isLoading && <Card className="p-4 text-sm text-slate-500">Memuat…</Card>}
      {!isLoading && data?.items.length === 0 && (
        <Card className="p-4 text-sm text-slate-500">Belum ada media.</Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {data?.items.map((m) => (
          <Card key={m.id} className="overflow-hidden">
            {m.mediaType === "image" ? (
              <img
                src={m.url}
                alt={m.filename}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="aspect-square w-full flex items-center justify-center bg-slate-100 text-slate-500 text-xs">
                {m.mediaType}
              </div>
            )}
            <div className="p-2 space-y-1">
              <div className="flex items-center justify-between gap-1">
                <Badge tone="gray">{m.bucket}</Badge>
                <span className="text-[10px] text-slate-400">
                  {Math.round(m.size / 1024)} KB
                </span>
              </div>
              <div
                className="truncate text-xs text-slate-700"
                title={m.filename}
              >
                {m.filename}
              </div>
              <div className="text-[10px] text-slate-400">
                {formatDate(m.createdAt)}
              </div>
              <div className="flex gap-1 pt-1">
                <Button
                  variant="secondary"
                  className="px-2 py-1 flex-1"
                  aria-label="Copy URL"
                  onClick={() => {
                    navigator.clipboard.writeText(m.url);
                    toast.success("URL disalin");
                  }}
                >
                  <Copy className="h-3 w-3" aria-hidden="true" /> URL
                </Button>
                <Button
                  variant="danger"
                  className="px-2 py-1"
                  aria-label="Hapus"
                  onClick={() => {
                    if (confirmDelete(`Hapus ${m.filename}?`))
                      del.mutate({ bucket: m.bucket, path: m.path });
                  }}
                >
                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
