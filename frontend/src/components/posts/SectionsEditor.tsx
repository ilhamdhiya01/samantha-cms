import { useState, type ReactNode } from "react";
import { GripVertical, Trash2, Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { RichTextEditor } from "@/components/posts/RichTextEditor";
import { uploadMedia } from "@/api/media";
import { type ImageItem } from "@/api/content";

export type SectionDraft = {
  id?: number;
  type:
    | "heading"
    | "paragraph"
    | "image"
    | "image_group"
    | "quote"
    | "code"
    | "divider";
  order: number;
  text?: string | null;
  url?: string | null;
  caption?: string | null;
  level?: number | null;
  language?: string | null;
  images?: ImageItem[] | null;
  children?: SectionDraft[] | null;
};

const TYPES: SectionDraft["type"][] = [
  "heading",
  "paragraph",
  "image",
  "image_group",
  "quote",
  "code",
  "divider",
];

interface Props {
  value: SectionDraft[];
  onChange: (next: SectionDraft[]) => void;
}

export function SectionsEditor({ value, onChange }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = value.map((_, i) => `s-${i}`);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(value, oldIndex, newIndex).map((s, i) => ({
      ...s,
      order: i,
    }));
    onChange(next);
  }

  function update(idx: number, patch: Partial<SectionDraft>) {
    onChange(value.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  function remove(idx: number) {
    onChange(
      value.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i })),
    );
  }

  function add(type: SectionDraft["type"]) {
    const next: SectionDraft = {
      type,
      order: value.length,
      text:
        type === "paragraph" || type === "quote" || type === "code" ? "" : null,
      level: type === "heading" ? 2 : null,
      url: type === "image" ? "" : null,
      caption: type === "image" ? "" : null,
      language: type === "code" ? "ts" : null,
      images: type === "image_group" ? [] : null,
      children: null,
    };
    onChange([...value, next]);
  }

  function updateChildren(idx: number, children: SectionDraft[]) {
    onChange(value.map((s, i) => (i === idx ? { ...s, children } : s)));
  }

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={value.map((_, i) => `s-${i}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {value.map((section, idx) => (
              <SortableSection
                key={`s-${idx}`}
                id={`s-${idx}`}
                section={section}
                onChange={(patch) => update(idx, patch)}
                onRemove={() => remove(idx)}
                childrenEditor={
                  <SubSectionsEditor
                    value={section.children ?? []}
                    onChange={(children) => updateChildren(idx, children)}
                  />
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
        {TYPES.map((t) => (
          <Button
            key={t}
            variant="secondary"
            type="button"
            onClick={() => add(t)}
          >
            <Plus className="h-3 w-3" aria-hidden="true" /> {t}
          </Button>
        ))}
      </div>
    </div>
  );
}

function SectionEditor({
  section,
  onChange,
  onRemove,
  dragHandle,
  allowChildren = true,
  childrenEditor,
}: {
  section: SectionDraft;
  onChange: (patch: Partial<SectionDraft>) => void;
  onRemove: () => void;
  dragHandle?: ReactNode;
  allowChildren?: boolean;
  childrenEditor?: ReactNode;
}) {
  return (
    <div className="border border-slate-200 rounded bg-white">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200 rounded-t">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
          {dragHandle}
          {section.type}
          {section.type === "heading" && (
            <select
              aria-label="Heading level"
              value={section.level ?? 2}
              onChange={(e) => onChange({ level: Number(e.target.value) })}
              className="ml-2 rounded border border-slate-300 text-xs"
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  H{n}
                </option>
              ))}
            </select>
          )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-rose-600 hover:bg-rose-50 rounded p-1"
          aria-label="Hapus section"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="p-3 space-y-2">
        {section.type === "image" ? (
          <ImageUploader
            url={section.url ?? ""}
            caption={section.caption ?? ""}
            onUrl={(url) => onChange({ url })}
            onCaption={(caption) => onChange({ caption })}
            onUpload={async (file) => {
              const url = await uploadMedia(file, "projects").then(
                (r) => r.url,
              );
              onChange({ url });
            }}
          />
        ) : section.type === "image_group" ? (
          <ImageGroupEditor
            images={section.images ?? []}
            onChange={(images) => onChange({ images })}
          />
        ) : section.type === "divider" ? null : section.type === "heading" ? (
          <Input
            placeholder={`Heading H${section.level ?? 2}`}
            value={section.text ?? ""}
            onChange={(e) => onChange({ text: e.target.value })}
          />
        ) : section.type === "code" ? (
          <>
            <Input
              placeholder="language (ts, js, …)"
              value={section.language ?? ""}
              onChange={(e) => onChange({ language: e.target.value })}
              className="w-32"
            />
            <Textarea
              rows={4}
              placeholder="Snippet code…"
              value={section.text ?? ""}
              onChange={(e) => onChange({ text: e.target.value })}
            />
          </>
        ) : section.type === "quote" ? (
          <Textarea
            rows={2}
            placeholder="Quote…"
            value={section.text ?? ""}
            onChange={(e) => onChange({ text: e.target.value })}
          />
        ) : (
          <RichTextEditor
            value={section.text ?? ""}
            placeholder="Tulis paragraf…"
            onChange={(html) => onChange({ text: html })}
          />
        )}
      </div>

      {allowChildren && childrenEditor && (
        <div className="border-t border-slate-200 bg-slate-50/50 p-3">
          <p className="text-xs font-medium text-slate-600 mb-2">
            Sub Sections
          </p>
          {childrenEditor}
        </div>
      )}
    </div>
  );
}

function SortableSection({
  id,
  section,
  onChange,
  onRemove,
  childrenEditor,
  allowChildren = true,
}: {
  id: string;
  section: SectionDraft;
  onChange: (patch: Partial<SectionDraft>) => void;
  onRemove: () => void;
  childrenEditor?: ReactNode;
  allowChildren?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <SectionEditor
        section={section}
        onChange={onChange}
        onRemove={onRemove}
        allowChildren={allowChildren}
        childrenEditor={childrenEditor}
        dragHandle={
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab text-slate-400 hover:text-slate-600"
            aria-label="Drag untuk reorder"
          >
            <GripVertical className="h-4 w-4" aria-hidden="true" />
          </button>
        }
      />
    </div>
  );
}

function SubSectionsEditor({
  value,
  onChange,
}: {
  value: SectionDraft[];
  onChange: (next: SectionDraft[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = value.map((_, i) => `sub-${i}`);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(value, oldIndex, newIndex).map((s, i) => ({
      ...s,
      order: i,
    }));
    onChange(next);
  }

  function update(idx: number, patch: Partial<SectionDraft>) {
    onChange(value.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  function remove(idx: number) {
    onChange(
      value.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i })),
    );
  }

  function add(type: SectionDraft["type"]) {
    const next: SectionDraft = {
      type,
      order: value.length,
      text:
        type === "paragraph" || type === "quote" || type === "code" ? "" : null,
      level: type === "heading" ? 2 : null,
      url: type === "image" ? "" : null,
      caption: type === "image" ? "" : null,
      language: type === "code" ? "ts" : null,
      images: type === "image_group" ? [] : null,
      children: null,
    };
    onChange([...value, next]);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={value.map((_, i) => `sub-${i}`)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {value.map((section, idx) => (
            <SortableSection
              key={`sub-${idx}`}
              id={`sub-${idx}`}
              section={section}
              onChange={(patch) => update(idx, patch)}
              onRemove={() => remove(idx)}
              allowChildren={false}
            />
          ))}
        </div>
      </SortableContext>
      <div className="flex flex-wrap gap-2 pt-2">
        {TYPES.map((t) => (
          <Button
            key={t}
            variant="secondary"
            type="button"
            onClick={() => add(t)}
          >
            <Plus className="h-3 w-3" aria-hidden="true" /> {t}
          </Button>
        ))}
      </div>
    </DndContext>
  );
}

function ImageUploader({
  url,
  caption,
  onUrl,
  onCaption,
  onUpload,
}: {
  url: string;
  caption: string;
  onUrl: (url: string) => void;
  onCaption: (caption: string) => void;
  onUpload: (file: File) => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      await onUpload(f);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="https://…"
          value={url}
          onChange={(e) => onUrl(e.target.value)}
          aria-label="Image URL"
        />
        <label className="cursor-pointer inline-flex items-center gap-1 rounded bg-slate-100 px-3 py-2 text-sm hover:bg-slate-200">
          {uploading ? "Uploading…" : "Upload"}
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={handleFile}
            disabled={uploading}
          />
        </label>
      </div>
      {url && (
        <img
          src={url}
          alt=""
          className="h-24 rounded border border-slate-200 object-cover"
        />
      )}
      <Input
        placeholder="Caption"
        value={caption}
        onChange={(e) => onCaption(e.target.value)}
        aria-label="Image caption"
      />
    </div>
  );
}

function ImageGroupEditor({
  images,
  onChange,
}: {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
}) {
  const [uploading, setUploading] = useState(false);

  function updateImage(idx: number, patch: Partial<ImageItem>) {
    onChange(images.map((img, i) => (i === idx ? { ...img, ...patch } : img)));
  }

  function removeImage(idx: number) {
    onChange(images.filter((_, i) => i !== idx));
  }

  async function addImage(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const newImages: ImageItem[] = [];
      for (const file of Array.from(files)) {
        const result = await uploadMedia(file, "projects");
        newImages.push({ url: result.url, caption: "" });
      }
      onChange([...images, ...newImages]);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {images.map((img, idx) => (
          <div
            key={idx}
            className="border border-slate-200 rounded p-2 space-y-2"
          >
            <img
              src={img.url}
              alt=""
              className="w-full h-24 rounded object-cover"
            />
            <Input
              placeholder="Caption"
              value={img.caption ?? ""}
              onChange={(e) => updateImage(idx, { caption: e.target.value })}
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="text-rose-600 hover:bg-rose-50 rounded p-1"
                aria-label="Hapus image"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <label className="cursor-pointer inline-flex items-center gap-1 rounded bg-slate-100 px-3 py-2 text-sm hover:bg-slate-200">
        {uploading ? "Uploading…" : "Tambah Image"}
        <input
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={addImage}
          disabled={uploading}
        />
      </label>
    </div>
  );
}
