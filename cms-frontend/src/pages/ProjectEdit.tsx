import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import {
  SectionsEditor,
  type SectionDraft,
} from "@/components/posts/SectionsEditor";
import {
  getProject,
  createProject,
  updateProject,
  type Project,
  type Section,
} from "@/api/content";
import { uploadMedia } from "@/api/media";
import toast from "react-hot-toast";

type ProjectInput = Omit<Project, "id" | "slug" | "createdAt" | "updatedAt">;

const schema = z.object({
  title: z.string().min(1, "Judul wajib diisi"),
  description: z.string().min(1, "Deskripsi singkat wajib diisi"),
  imageUrl: z.string().optional().or(z.literal("")),
  techStack: z.string().optional(),
  liveUrl: z.string().optional().or(z.literal("")),
  repoUrl: z.string().optional().or(z.literal("")),
  status: z.enum(["ongoing", "completed", "archived"]),
  startedAt: z.string().nullable().optional(),
  endedAt: z.string().nullable().optional(),
  sections: z.any().array().default([]),
});

type FormValues = z.infer<typeof schema>;

export function ProjectEdit() {
  const { id } = useParams<{ id?: string }>();
  const isNew = !id || id === "new";
  const nav = useNavigate();
  const qc = useQueryClient();

  const [uploading, setUploading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      techStack: "",
      liveUrl: "",
      repoUrl: "",
      status: "ongoing",
      startedAt: null,
      endedAt: null,
      sections: [],
    },
  });

  const imageUrl = watch("imageUrl");

  const { data: existing, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => getProject(Number(id)),
    enabled: !isNew,
  });

  function toSectionDraft(s: Section): SectionDraft {
    return {
      id: s.id,
      type: s.type,
      order: s.order,
      text: s.text ?? "",
      url: s.url ?? "",
      caption: s.caption ?? "",
      level: s.level ?? null,
      language: s.language ?? null,
      images: s.images ?? null,
      children: s.children?.map(toSectionDraft) ?? null,
    };
  }

  function toSectionPayload(s: SectionDraft): Section {
    const base = { type: s.type, order: s.order } as Section;
    if (s.id !== undefined) base.id = s.id;
    if (s.type === "heading") {
      base.text = s.text ?? null;
      base.level = s.level ?? null;
    } else if (s.type === "paragraph" || s.type === "quote") {
      base.text = s.text ?? null;
    } else if (s.type === "code") {
      base.text = s.text ?? null;
      base.language = s.language ?? null;
    } else if (s.type === "image") {
      base.url = s.url ?? null;
      base.caption = s.caption ?? null;
    } else if (s.type === "image_group") {
      base.images = (s.images ?? []).map((img) => ({
        url: img.url,
        caption: img.caption ?? null,
      }));
    }
    if (s.children && s.children.length > 0) {
      base.children = s.children.map(toSectionPayload);
    }
    return base;
  }

  useEffect(() => {
    if (existing) {
      reset({
        title: existing.title,
        description: existing.description,
        imageUrl: existing.imageUrl ?? "",
        techStack: existing.techStack.join(", "),
        liveUrl: existing.liveUrl ?? "",
        repoUrl: existing.repoUrl ?? "",
        status: existing.status,
        startedAt: existing.startedAt ?? null,
        endedAt: existing.endedAt ?? null,
        sections: existing.sections.map(toSectionDraft),
      });
    }
  }, [existing, reset]);

  const save = useMutation({
    mutationFn: async (payload: ProjectInput) => {
      const sections: Section[] = payload.sections.map(toSectionPayload);
      if (isNew) return createProject({ ...payload, sections });
      return updateProject(Number(id), { ...payload, sections });
    },
    onSuccess: (project) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      if (isNew) nav(`/projects/${project.id}`, { replace: true });
      toast.success(
        isNew ? "Project baru berhasil dibuat" : "Project berhasil diperbarui",
      );
    },
    onError: (e: Error) => setApiError(e.message),
  });

  async function onSubmit(values: FormValues) {
    setApiError(null);
    const payload: ProjectInput = {
      title: values.title,
      description: values.description,
      imageUrl: values.imageUrl || null,
      techStack: (values.techStack ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      liveUrl: values.liveUrl || null,
      repoUrl: values.repoUrl || null,
      status: values.status,
      startedAt: values.startedAt || null,
      endedAt: values.endedAt || null,
      sections: values.sections as SectionDraft[],
    };
    try {
      await save.mutateAsync(payload);
    } catch {
      // error sudah di-set via mutation onError
    }
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const result = await uploadMedia(f, "projects");
      if (result) {
        toast.success("Gambar berhasil diunggah");
        setValue("imageUrl", result.url);
      }
    } catch (err) {
      setApiError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  if (!isNew && isLoading) {
    return <div className="text-slate-500 text-sm">Memuat…</div>;
  }

  return (
    <div>
      <PageHeader
        title={isNew ? "Project Baru" : `Edit: ${watch("title")}`}
        action={
          <div className="flex gap-2">
            <Link to="/projects">
              <Button variant="ghost">Batal</Button>
            </Link>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting || save.isPending}
            >
              <Save className="h-4 w-4" aria-hidden="true" /> Simpan
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 lg:col-span-2 space-y-4">
          <div>
            <label
              htmlFor="title"
              className="text-xs font-medium text-slate-600"
            >
              Judul
            </label>
            <Input id="title" {...register("title")} />
            {errors.title && (
              <p className="text-xs text-rose-600 mt-1">
                {errors.title.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="description"
              className="text-xs font-medium text-slate-600"
            >
              Deskripsi Singkat
            </label>
            <Textarea id="description" rows={3} {...register("description")} />
            {errors.description && (
              <p className="text-xs text-rose-600 mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Image</label>
            <div className="flex gap-2 mt-1">
              <Input placeholder="https://…" {...register("imageUrl")} />
              <label className="cursor-pointer inline-flex items-center gap-1 rounded bg-slate-100 px-3 py-2 text-sm hover:bg-slate-200">
                {uploading ? "Uploading…" : "Upload"}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={onUpload}
                  disabled={uploading}
                />
              </label>
            </div>
            {imageUrl && (
              <img
                src={imageUrl}
                alt=""
                className="mt-2 h-24 rounded border border-slate-200 object-cover"
              />
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">
              Sections (drag untuk reorder)
            </label>
            <div className="mt-1">
              <Controller
                name="sections"
                control={control}
                render={({ field }) => (
                  <SectionsEditor
                    value={field.value as SectionDraft[]}
                    onChange={(s) => field.onChange(s)}
                  />
                )}
              />
            </div>
          </div>
          {apiError && <p className="text-sm text-rose-600">{apiError}</p>}
        </Card>

        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <h3 className="font-semibold text-slate-900">Status</h3>
            <select
              aria-label="Status"
              {...register("status")}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="ongoing">ongoing</option>
              <option value="completed">completed</option>
              <option value="archived">archived</option>
            </select>
          </Card>

          <Card className="p-4 space-y-3">
            <h3 className="font-semibold text-slate-900">Detail</h3>
            <div>
              <label className="text-xs font-medium text-slate-600">
                Live URL
              </label>
              <Input {...register("liveUrl")} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">
                Repo URL
              </label>
              <Input {...register("repoUrl")} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">
                Tech stack (comma-separated)
              </label>
              <Input
                placeholder="react, node, postgres"
                {...register("techStack")}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">
                Mulai
              </label>
              <Input
                type="date"
                {...register("startedAt")}
                value={
                  watch("startedAt") ? watch("startedAt")!.slice(0, 10) : ""
                }
                onChange={(e) =>
                  setValue(
                    "startedAt",
                    e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null,
                  )
                }
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">
                Selesai
              </label>
              <Input
                type="date"
                {...register("endedAt")}
                value={watch("endedAt") ? watch("endedAt")!.slice(0, 10) : ""}
                onChange={(e) =>
                  setValue(
                    "endedAt",
                    e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null,
                  )
                }
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
