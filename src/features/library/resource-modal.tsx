"use client";
import { useEffect, useId, useState } from "react";
import { Download, Eye, FileText, NotebookPen, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppDialog } from "@/components/forms/app-dialog";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { Textarea } from "@/components/shadcn/textarea";
import { PanelMessage } from "@/components/layout/panel-message";
import { ApiError } from "@/lib/api/contracts";
import {
  ACCEPTED_FILES,
  REVIEW_STATE,
  fetchResourceFile,
  formatFileSize,
  useResources,
  useSaveResource,
  useWithdrawResource,
  type LibraryCard,
  type Resource,
  type ResourceKind,
} from "./api";

const TITLE_MAX = 150;
const DESCRIPTION_MAX = 1000;
const NOTE_MAX = 20000;

type View = { kind: "list" } | { kind: "form"; resource?: Resource } | { kind: "withdraw"; resource: Resource };

/**
 * The resources of one subject card: the list with each item's review state, and the add/edit form in the
 * same modal. Saving always sends the item to review; an approved item stays visible to students in its
 * approved version until the change is approved.
 */
export function ResourceModal({ card, onClose }: { card: LibraryCard; onClose: () => void }) {
  const resources = useResources(card.curriculumId);
  const withdraw = useWithdrawResource(card.curriculumId);
  const [view, setView] = useState<View>({ kind: "list" });

  const confirmWithdraw = async (resource: Resource) => {
    try {
      await withdraw.mutateAsync(resource.id);
      toast.success(`“${resource.title}” withdrawn`);
      setView({ kind: "list" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "The resource could not be withdrawn.");
    }
  };

  if (view.kind === "form") {
    return (
      <ResourceForm
        card={card}
        resource={view.resource}
        onDone={() => setView({ kind: "list" })}
        onClose={onClose}
      />
    );
  }

  return (
    <AppDialog
      open
      onClose={onClose}
      width={760}
      title={card.subject}
      subtitle={card.pathLabel}
      footer={
        view.kind === "withdraw" ? (
          <>
            <Button variant="outline" onClick={() => setView({ kind: "list" })} disabled={withdraw.isPending}>
              Keep it
            </Button>
            <Button variant="destructive" onClick={() => void confirmWithdraw(view.resource)} disabled={withdraw.isPending}>
              {withdraw.isPending ? "Withdrawing…" : "Withdraw"}
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => setView({ kind: "form" })}>
              <Plus aria-hidden /> Add resource
            </Button>
          </>
        )
      }
    >
      {view.kind === "withdraw" ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">Withdraw “{view.resource.title}”?</p>
          <p className="text-sm text-text-secondary">
            It is removed from your library and is no longer shown to students. Any change waiting for review is withdrawn too.
          </p>
        </div>
      ) : resources.isPending ? (
        <div className="flex flex-col gap-2" role="status" aria-label="Loading resources">
          {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : resources.isError ? (
        <PanelMessage onRetry={() => void resources.refetch()}>The resources could not be loaded.</PanelMessage>
      ) : resources.data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border-strong px-6 py-10 text-center">
          <p className="font-semibold">No resources yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">Add notes or files (PDF, images, Word or PowerPoint) for this subject.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {resources.data.map((resource) => (
            <ResourceItem
              key={resource.id}
              resource={resource}
              onEdit={() => setView({ kind: "form", resource })}
              onWithdraw={() => setView({ kind: "withdraw", resource })}
            />
          ))}
        </ul>
      )}
    </AppDialog>
  );
}

function ResourceItem({ resource, onEdit, onWithdraw }: { resource: Resource; onEdit: () => void; onWithdraw: () => void }) {
  const state = REVIEW_STATE[resource.reviewState];
  const [showNote, setShowNote] = useState(false);
  const rejectedNotes =
    resource.lastDecision?.decision === "rejected" && (resource.reviewState === "rejected" || resource.reviewState === "edit_rejected")
      ? resource.lastDecision.notes
      : null;
  return (
    <li className="flex flex-col gap-2 rounded-md border border-border-subtle p-4">
      <div className="flex flex-wrap items-start gap-3">
        {resource.kind === "note" ? (
          <NotebookPen aria-hidden className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        ) : (
          <FileText aria-hidden className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="text-sm font-semibold break-words">{resource.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {resource.kind === "note" ? "Note" : resource.file ? `${resource.file.name} · ${formatFileSize(resource.file.size)}` : "File"}
          </p>
        </div>
        <Badge variant={state.variant}>{state.label}</Badge>
      </div>
      {resource.description && <p className="text-sm whitespace-pre-wrap text-text-secondary">{resource.description}</p>}
      {rejectedNotes && (
        <p className="rounded-md bg-error-subtle px-3 py-2 text-xs text-error-foreground">
          {resource.reviewState === "edit_rejected" ? "Your last changes were not approved: " : "Not approved: "}
          {rejectedNotes}
        </p>
      )}
      {resource.pendingEdit && (
        <p className="text-xs text-text-secondary">
          Changes waiting for review: “{resource.pendingEdit.title}”. Students see the approved version until then.
        </p>
      )}
      {resource.kind === "note" && showNote && (
        <div className="max-h-64 overflow-y-auto rounded-md border border-border-subtle bg-sunken p-3 text-sm whitespace-pre-wrap">
          {resource.body}
        </div>
      )}
      <div className="flex flex-wrap gap-1">
        {resource.kind === "note" ? (
          <Button size="sm" variant="ghost" onClick={() => setShowNote((v) => !v)} aria-expanded={showNote}>
            <Eye aria-hidden /> {showNote ? "Hide note" : "View note"}
          </Button>
        ) : (
          resource.file && <FileButtons resource={resource} />
        )}
        <Button size="sm" variant="ghost" onClick={onEdit} aria-label={`Edit ${resource.title}`}>
          <Pencil aria-hidden /> Edit
        </Button>
        <Button size="sm" variant="ghost" onClick={onWithdraw} aria-label={`Withdraw ${resource.title}`}>
          <Trash2 aria-hidden /> Withdraw
        </Button>
      </div>
    </li>
  );
}

function FileButtons({ resource }: { resource: Resource }) {
  const [opening, setOpening] = useState(false);
  const file = resource.file!;
  const open = async (download: boolean) => {
    setOpening(true);
    try {
      const url = await fetchResourceFile(resource.id);
      if (download) {
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        // PDF and images open in a new tab from the blob; the blob stays alive for a minute
        window.open(url, "_blank", "noopener");
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "The file could not be opened.");
    } finally {
      setOpening(false);
    }
  };
  return (
    <>
      {file.previewable && (
        <Button size="sm" variant="ghost" disabled={opening} onClick={() => void open(false)} aria-label={`Open ${file.name}`}>
          <Eye aria-hidden /> Open
        </Button>
      )}
      <Button size="sm" variant="ghost" disabled={opening} onClick={() => void open(true)} aria-label={`Download ${file.name}`}>
        <Download aria-hidden /> Download
      </Button>
    </>
  );
}

function ResourceForm({
  card,
  resource,
  onDone,
  onClose,
}: {
  card: LibraryCard;
  resource?: Resource;
  onDone: () => void;
  onClose: () => void;
}) {
  // Editing starts from the latest version: the change waiting for review, else the current one
  const base = resource?.pendingEdit ?? resource;
  const save = useSaveResource(card.curriculumId);
  const [kind, setKind] = useState<ResourceKind>(base?.kind ?? "file");
  const [title, setTitle] = useState(base?.title ?? "");
  const [description, setDescription] = useState(base?.description ?? "");
  const [body, setBody] = useState(base?.body ?? "");
  const [file, setFile] = useState<File>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const ids = { title: useId(), description: useId(), body: useId(), file: useId() };
  const keepsFile = Boolean(base?.kind === "file" && base.file && kind === "file");

  useEffect(() => setErrors({}), [kind]);

  const submit = async () => {
    const next: Record<string, string> = {};
    if (title.trim().length < 2) next.title = "Enter a title.";
    if (kind === "note" && !body.trim()) next.body = "Write the note.";
    if (kind === "file" && !file && !keepsFile) next.file = "Choose a file to upload.";
    setErrors(next);
    setFormError(undefined);
    if (Object.keys(next).length) return;
    try {
      await save.mutateAsync({ resourceId: resource?.id, curriculumId: card.curriculumId, kind, title, description, body, file });
      toast.success(resource ? "Changes sent for review" : "Resource sent for review", {
        description: resource?.reviewState.startsWith("approved") || resource?.reviewState.startsWith("edit")
          ? "Students keep seeing the approved version until the changes are approved."
          : "Amentorz reviews it before students see it.",
      });
      onDone();
    } catch (e) {
      if (e instanceof ApiError && e.fields) {
        setErrors(Object.fromEntries(Object.entries(e.fields).map(([k, v]) => [k, v[0] ?? ""])));
      }
      setFormError(e instanceof Error ? e.message : "The resource could not be saved.");
    }
  };

  const describedBy = (field: keyof typeof ids) => (errors[field] ? `${ids[field]}-error` : undefined);
  const fieldError = (field: keyof typeof ids) =>
    errors[field] ? (
      <p id={`${ids[field]}-error`} className="text-xs text-destructive">
        {errors[field]}
      </p>
    ) : null;

  return (
    <AppDialog
      open
      onClose={onClose}
      width={760}
      title={resource ? "Edit resource" : "Add resource"}
      subtitle={`${card.subject} · ${card.pathLabel}`}
      footer={
        <>
          <Button variant="outline" onClick={onDone} disabled={save.isPending}>
            Back
          </Button>
          <Button onClick={() => void submit()} disabled={save.isPending}>
            {save.isPending ? "Sending…" : "Send for review"}
          </Button>
        </>
      }
    >
      <Tabs value={kind} onValueChange={(v) => setKind(v === "note" ? "note" : "file")}>
        <TabsList aria-label="Resource type">
          <TabsTrigger value="file">
            <FileText aria-hidden /> File
          </TabsTrigger>
          <TabsTrigger value="note">
            <NotebookPen aria-hidden /> Note
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-2">
        <Label htmlFor={ids.title}>
          Title <span aria-hidden className="text-error-foreground">*</span>
        </Label>
        <Input
          id={ids.title}
          value={title}
          maxLength={TITLE_MAX}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={Boolean(errors.title) || undefined}
          aria-describedby={describedBy("title")}
          data-autofocus
        />
        {fieldError("title")}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={ids.description}>Description</Label>
        <Textarea
          id={ids.description}
          rows={2}
          value={description}
          maxLength={DESCRIPTION_MAX}
          onChange={(e) => setDescription(e.target.value)}
          aria-invalid={Boolean(errors.description) || undefined}
          aria-describedby={describedBy("description")}
        />
        {fieldError("description")}
      </div>

      {kind === "note" ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor={ids.body}>
            Note <span aria-hidden className="text-error-foreground">*</span>
          </Label>
          <Textarea
            id={ids.body}
            rows={10}
            value={body}
            maxLength={NOTE_MAX}
            onChange={(e) => setBody(e.target.value)}
            aria-invalid={Boolean(errors.body) || undefined}
            aria-describedby={describedBy("body")}
          />
          <p className="text-xs text-muted-foreground">{body.length.toLocaleString("en-IN")} / {NOTE_MAX.toLocaleString("en-IN")} characters</p>
          {fieldError("body")}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Label htmlFor={ids.file}>
            File {!keepsFile && <span aria-hidden className="text-error-foreground">*</span>}
          </Label>
          <Input
            id={ids.file}
            type="file"
            accept={ACCEPTED_FILES}
            onChange={(e) => setFile(e.target.files?.[0])}
            aria-invalid={Boolean(errors.file) || undefined}
            aria-describedby={`${ids.file}-hint${errors.file ? ` ${ids.file}-error` : ""}`}
          />
          <p id={`${ids.file}-hint`} className="text-xs text-muted-foreground">
            PDF, JPG, PNG, DOC, DOCX, PPT or PPTX.
            {keepsFile && base?.file ? ` Leave empty to keep ${base.file.name}.` : ""}
          </p>
          {fieldError("file")}
        </div>
      )}

      <p className="rounded-md bg-sunken px-3 py-2 text-xs text-text-secondary">
        Amentorz reviews every new resource and every change before students see it.
      </p>
      {formError && (
        <p className="text-xs text-destructive" role="alert">
          {formError}
        </p>
      )}
    </AppDialog>
  );
}
