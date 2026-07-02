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
import { getPost, createPost, updatePost, type PostInput } from "@/api/posts";
import { listCategories, listTags } from "@/api/taxonomy";
import { uploadMedia } from "@/api/media";

const schema = z.object({
  title: z.string().min(1, "Judul wajib diisi"),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  thumbnail: z.string().optional().or(z.literal("")),
  status: z.enum(["draft", "published"]),
  publishedAt: z.string().nullable().optional(),
  sections: z.any().array().default([]),
  categoryIds: z.number().array().default([]),
  tagIds: z.number().array().default([]),
});

type FormValues = z.infer<typeof schema>;

export function PostEdit() {
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
      slug: "",
      excerpt: "",
      thumbnail: "",
      status: "draft",
      publishedAt: null,
      sections: [],
      categoryIds: [],
      tagIds: [],
    },
  });

  const thumbnail = watch("thumbnail");

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });
  const { data: tags } = useQuery({ queryKey: ["tags"], queryFn: listTags });

  const { data: existing, isLoading } = useQuery({
    queryKey: ["post", id],
    queryFn: () => getPost(Number(id)),
    enabled: !isNew,
  });

  useEffect(() => {
    if (existing) {
      reset({
        title: existing.title,
        slug: existing.slug,
        excerpt: existing.excerpt ?? "",
        thumbnail: existing.thumbnail ?? "",
        status: existing.status,
        publishedAt: existing.publishedAt ?? null,
        sections: existing.sections.map((s) => ({
          id: s.id,
          type: s.type,
          order: s.order,
          text: s.text ?? "",
          url: s.url ?? "",
          caption: s.caption ?? "",
          level: s.level ?? null,
          language: s.language ?? null,
          images: s.images ?? null,
          children:
            s.children?.map((c) => ({
              id: c.id,
              type: c.type,
              order: c.order,
              text: c.text ?? "",
              url: c.url ?? "",
              caption: c.caption ?? "",
              level: c.level ?? null,
              language: c.language ?? null,
              images: c.images ?? null,
              children: null,
            })) ?? null,
        })),
        categoryIds: existing.categories?.map((c) => c.category.id) ?? [],
        tagIds: existing.tags?.map((t) => t.tag.id) ?? [],
      });
    }
  }, [existing, reset]);

  const save = useMutation({
    mutationFn: async (values: { publish: boolean; payload: PostInput }) => {
      const payload: PostInput = {
        ...values.payload,
        status: values.publish ? "published" : values.payload.status,
      };
      if (isNew) return createPost(payload);
      return updatePost(Number(id), payload);
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      if (isNew && variables.payload.title) {
        // navigasi akan dilakukan setelah refetch; di sini tidak ada post id
        return;
      }
    },
    onError: (e: Error) => setApiError(e.message),
  });

  async function onSubmit(values: FormValues, publish: boolean) {
    setApiError(null);
    const payload: PostInput = {
      ...values,
      excerpt: values.excerpt || null,
      thumbnail: values.thumbnail || null,
      publishedAt: values.publishedAt || null,
      sections: values.sections as SectionDraft[],
    };
    try {
      const post = await save.mutateAsync({ publish, payload });
      if (isNew && post) {
        nav(`/posts/${post.id}`, { replace: true });
      }
    } catch {
      // error sudah di-set via mutation onError
    }
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const result = await uploadMedia(f, "blog");
      setValue("thumbnail", result.url);
    } catch (err) {
      setApiError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function toggleId(list: number[], id: number): number[] {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  }

  if (!isNew && isLoading) {
    return <div className="text-slate-500 text-sm">Memuat…</div>;
  }

  return (
    <div>
      <PageHeader
        title={isNew ? "Post Baru" : `Edit: ${watch("title")}`}
        action={
          <div className="flex gap-2">
            <Link to="/posts">
              <Button variant="ghost">Batal</Button>
            </Link>
            <Button
              variant="secondary"
              onClick={handleSubmit((v) => onSubmit(v, false))}
              disabled={isSubmitting || save.isPending}
            >
              <Save className="h-4 w-4" aria-hidden="true" /> Save Draft
            </Button>
            <Button
              onClick={handleSubmit((v) => onSubmit(v, true))}
              disabled={isSubmitting || save.isPending}
            >
              Publish
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
              htmlFor="slug"
              className="text-xs font-medium text-slate-600"
            >
              Slug (auto dari judul jika kosong)
            </label>
            <Input id="slug" {...register("slug")} />
          </div>
          <div>
            <label
              htmlFor="excerpt"
              className="text-xs font-medium text-slate-600"
            >
              Excerpt
            </label>
            <Textarea id="excerpt" rows={3} {...register("excerpt")} />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">
              Thumbnail
            </label>
            <div className="flex gap-2 mt-1">
              <Input placeholder="https://…" {...register("thumbnail")} />
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
            {thumbnail && (
              <img
                src={thumbnail}
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
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold text-slate-900 mb-2">Categories</h3>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {categories?.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={watch("categoryIds").includes(c.id)}
                    onChange={() =>
                      setValue(
                        "categoryIds",
                        toggleId(watch("categoryIds"), c.id),
                      )
                    }
                  />
                  {c.name}
                </label>
              ))}
              {(!categories || categories.length === 0) && (
                <div className="text-xs text-slate-500">Belum ada category</div>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold text-slate-900 mb-2">Tags</h3>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {tags?.map((t) => (
                <label key={t.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={watch("tagIds").includes(t.id)}
                    onChange={() =>
                      setValue("tagIds", toggleId(watch("tagIds"), t.id))
                    }
                  />
                  {t.name}
                </label>
              ))}
              {(!tags || tags.length === 0) && (
                <div className="text-xs text-slate-500">Belum ada tag</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
