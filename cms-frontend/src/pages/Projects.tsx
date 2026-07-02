import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Trash2, Pencil, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { listProjects, deleteProject, type Project } from "@/api/content";
import { confirmDelete } from "@/lib/dialogs";
import { toast } from "react-hot-toast";

export function Projects() {
  const qc = useQueryClient();
  const nav = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => listProjects({ pageSize: 50 }),
  });

  const del = useMutation({
    mutationFn: (id: number) => deleteProject(id),
    onSuccess: () => {
      toast.success("Project dihapus");
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Daftar project portfolio."
        action={
          <Button onClick={() => nav("/projects/new")}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Project Baru
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && (
          <Card className="p-4 text-sm text-slate-500">Memuat…</Card>
        )}
        {!isLoading && data?.items.length === 0 && (
          <Card className="p-4 text-sm text-slate-500">Belum ada project.</Card>
        )}
        {data?.items.map((p) => (
          <Card key={p.id} className="p-4 space-y-2">
            {p.imageUrl && (
              <img
                src={p.imageUrl}
                alt={p.title}
                className="rounded border border-slate-200 h-32 w-full object-cover"
              />
            )}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-900">{p.title}</h3>
                <Badge
                  tone={
                    p.status === "completed"
                      ? "green"
                      : p.status === "archived"
                        ? "gray"
                        : "blue"
                  }
                >
                  {p.status}
                </Badge>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="secondary"
                  className="px-2 py-1"
                  aria-label="Edit"
                  onClick={() => nav(`/projects/${p.id}`)}
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="danger"
                  className="px-2 py-1"
                  aria-label="Hapus"
                  onClick={() => {
                    if (confirmDelete(`Hapus project "${p.title}"?`))
                      del.mutate(p.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-slate-600">{p.description}</p>
            <div className="flex flex-wrap gap-1">
              {p.techStack.map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
