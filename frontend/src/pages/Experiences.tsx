import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Trash2, Plus, Pencil } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { RichTextEditor } from "@/components/posts/RichTextEditor";
import {
  listExperiences,
  createExperience,
  updateExperience,
  deleteExperience,
  type Experience,
} from "@/api/content";
import { formatDate } from "@/lib/utils";
import { confirmDelete } from "@/lib/dialogs";

const schema = z.object({
  company: z.string().min(1, "Company wajib diisi"),
  role: z.string().min(1, "Role wajib diisi"),
  description: z.string().min(1, "Deskripsi wajib diisi"),
  location: z.string().optional(),
  startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
  endDate: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function Experiences() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Experience | null>(null);
  const [creating, setCreating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      company: "",
      role: "",
      description: "",
      location: "",
      startDate: "",
      endDate: "",
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["experiences"],
    queryFn: listExperiences,
  });

  const del = useMutation({
    mutationFn: (id: number) => deleteExperience(id),
    onSuccess: () => {
      toast.success("Experience dihapus");
      qc.invalidateQueries({ queryKey: ["experiences"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const upsert = useMutation({
    mutationFn: async (vars: { id?: number; values: FormValues }) => {
      const payload = {
        company: vars.values.company,
        role: vars.values.role,
        description: vars.values.description,
        location: vars.values.location || undefined,
        startDate: new Date(vars.values.startDate).toISOString(),
        endDate: vars.values.endDate
          ? new Date(vars.values.endDate).toISOString()
          : null,
      };
      if (vars.id) return updateExperience(vars.id, payload);
      return createExperience(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["experiences"] });
      setEditing(null);
      setCreating(false);
      setApiError(null);
      reset({
        company: "",
        role: "",
        description: "",
        location: "",
        startDate: "",
        endDate: "",
      });
      toast.success("Experience disimpan");
    },
    onError: (e: Error) => setApiError(e.message),
  });

  function startEdit(e: Experience) {
    setCreating(false);
    setEditing(e);
    setApiError(null);
    reset({
      company: e.company,
      role: e.role,
      description: e.description,
      location: e.location ?? "",
      startDate: e.startDate?.slice(0, 10) ?? "",
      endDate: e.endDate?.slice(0, 10) ?? "",
    });
  }

  function onSubmit(values: FormValues) {
    setApiError(null);
    upsert.mutate({ id: editing?.id, values });
  }

  function onCancel() {
    setEditing(null);
    setCreating(false);
    setApiError(null);
    reset({
      company: "",
      role: "",
      description: "",
      location: "",
      startDate: "",
      endDate: "",
    });
  }

  return (
    <div>
      <PageHeader
        title="Experiences"
        description="Pengalaman kerja — ditampilkan di profile."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Tambah
          </Button>
        }
      />

      {(creating || editing) && (
        <form onSubmit={handleSubmit(onSubmit)} className="mb-4">
          <Card className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Company
                </label>
                <Input {...register("company")} />
                {errors.company && (
                  <p className="text-xs text-rose-600 mt-1">
                    {errors.company.message}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Role
                </label>
                <Input {...register("role")} />
                {errors.role && (
                  <p className="text-xs text-rose-600 mt-1">
                    {errors.role.message}
                  </p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-slate-600">
                  Deskripsi
                </label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Tulis deskripsi pengalaman…"
                    />
                  )}
                />
                {errors.description && (
                  <p className="text-xs text-rose-600 mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Lokasi
                </label>
                <Input {...register("location")} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Mulai
                </label>
                <Input type="date" {...register("startDate")} />
                {errors.startDate && (
                  <p className="text-xs text-rose-600 mt-1">
                    {errors.startDate.message}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Selesai (kosongkan jika masih berlangsung)
                </label>
                <Input type="date" {...register("endDate")} />
              </div>
            </div>
            {apiError && <p className="text-sm text-rose-600">{apiError}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" type="button" onClick={onCancel}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting || upsert.isPending}>
                {editing ? "Update" : "Buat"}
              </Button>
            </div>
          </Card>
        </form>
      )}

      <div className="space-y-3">
        {isLoading && (
          <Card className="p-4 text-sm text-slate-500">Memuat…</Card>
        )}
        {!isLoading && data?.length === 0 && (
          <Card className="p-4 text-sm text-slate-500">
            Belum ada experience.
          </Card>
        )}
        {data?.map((e) => (
          <Card key={e.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-900">{e.role}</h3>
                  <Badge tone="blue">{e.company}</Badge>
                  {e.location && <Badge>{e.location}</Badge>}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {formatDate(e.startDate)} →{" "}
                  {e.endDate ? formatDate(e.endDate) : "Sekarang"}
                </div>
                <div
                  className="prose prose-sm max-w-none text-sm text-slate-700 mt-2"
                  dangerouslySetInnerHTML={{ __html: e.description }}
                />
              </div>
              <div className="flex gap-1">
                <Button
                  variant="secondary"
                  className="px-2 py-1"
                  aria-label="Edit"
                  onClick={() => startEdit(e)}
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="danger"
                  className="px-2 py-1"
                  aria-label="Hapus"
                  onClick={() => {
                    if (confirmDelete(`Hapus experience di ${e.company}?`))
                      del.mutate(e.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
