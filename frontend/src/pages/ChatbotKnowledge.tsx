import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Trash2, Pencil, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Textarea } from "@/components/ui/Input";
import {
  listKnowledge,
  createKnowledge,
  updateKnowledge,
  deleteKnowledge,
  type Knowledge,
} from "@/api/content";
import { confirmDelete } from "@/lib/dialogs";

const schema = z.object({
  question: z.string().min(1, "Question wajib diisi"),
  answer: z.string().min(1, "Answer wajib diisi"),
  keywords: z.string().optional(),
  enabled: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

export function ChatbotKnowledge() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Knowledge | null>(null);
  const [creating, setCreating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      question: "",
      answer: "",
      keywords: "",
      enabled: true,
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["knowledge"],
    queryFn: () => listKnowledge({ pageSize: 100 }),
  });

  const del = useMutation({
    mutationFn: (id: number) => deleteKnowledge(id),
    onSuccess: () => {
      toast.success("Knowledge dihapus");
      qc.invalidateQueries({ queryKey: ["knowledge"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const upsert = useMutation({
    mutationFn: async (vars: { id?: number; values: FormValues }) => {
      const payload = {
        question: vars.values.question,
        answer: vars.values.answer,
        keywords: (vars.values.keywords ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        enabled: vars.values.enabled,
      };
      if (vars.id) return updateKnowledge(vars.id, payload);
      return createKnowledge(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["knowledge"] });
      setEditing(null);
      setCreating(false);
      reset({
        question: "",
        answer: "",
        keywords: "",
        enabled: true,
      });
      toast.success("Knowledge disimpan");
    },
    onError: (e: Error) => setApiError(e.message),
  });

  function startCreate() {
    setEditing(null);
    reset({
      question: "",
      answer: "",
      keywords: "",
      enabled: true,
    });
    setCreating(true);
    setApiError(null);
  }

  function startEdit(k: Knowledge) {
    setCreating(false);
    setEditing(k);
    reset({
      question: k.question,
      answer: k.answer,
      keywords: k.keywords.join(", "),
      enabled: k.enabled,
    });
    setApiError(null);
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
      question: "",
      answer: "",
      keywords: "",
      enabled: true,
    });
  }

  return (
    <div>
      <PageHeader
        title="Chatbot Knowledge"
        description="Q&A pairs yang dipakai chatbot untuk menjawab pertanyaan."
        action={
          <Button onClick={startCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Tambah Q&A
          </Button>
        }
      />

      {(creating || editing) && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="p-4 space-y-3 mb-4">
            <div>
              <label className="text-xs font-medium text-slate-600">
                Question
              </label>
              <Input {...register("question")} />
              {errors.question && (
                <p className="text-xs text-rose-600 mt-1">
                  {errors.question.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">
                Answer
              </label>
              <Textarea rows={3} {...register("answer")} />
              {errors.answer && (
                <p className="text-xs text-rose-600 mt-1">
                  {errors.answer.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">
                Keywords (comma-separated)
              </label>
              <Input {...register("keywords")} placeholder="harga, pricing" />
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("enabled")} />
              Enabled
            </label>
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

      <div className="space-y-2">
        {isLoading && (
          <Card className="p-4 text-sm text-slate-500">Memuat…</Card>
        )}
        {!isLoading && data?.items.length === 0 && (
          <Card className="p-4 text-sm text-slate-500">
            Belum ada knowledge.
          </Card>
        )}
        {data?.items.map((k) => (
          <Card key={k.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">{k.question}</h3>
                  <Badge tone={k.enabled ? "green" : "gray"}>
                    {k.enabled ? "enabled" : "disabled"}
                  </Badge>
                </div>
                <p className="text-sm text-slate-700 mt-1 whitespace-pre-line">
                  {k.answer}
                </p>
                {k.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {k.keywords.map((kw) => (
                      <Badge key={kw}>{kw}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="secondary"
                  className="px-2 py-1"
                  aria-label="Edit"
                  onClick={() => startEdit(k)}
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="danger"
                  className="px-2 py-1"
                  aria-label="Hapus"
                  onClick={() => {
                    if (confirmDelete(`Hapus Q&A "${k.question}"?`))
                      del.mutate(k.id);
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
