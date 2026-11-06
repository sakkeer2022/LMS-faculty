"use client";
import { useId, useRef, useState, type ComponentProps, type DragEvent, type ReactNode } from "react";
import { Eye, EyeOff, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";

/* Form controls for the onboarding screens (Figma 43b-43d). Each field links its label, hint and error. */

type FieldBase = { label: string; hint?: string; error?: string; required?: boolean; className?: string };

const describedBy = (id: string, hint?: string, error?: string) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;

function FieldShell({ id, label, hint, error, required, className, children }: FieldBase & { id: string; children: ReactNode }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={id} className="flex gap-1 text-[13px] leading-[18px] font-semibold">
        {label}
        {required && (
          <span aria-hidden className="text-destructive">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-[11px] leading-4 text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs leading-4 text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** A form whose controls disable together while it submits. */
export function Form({ pending, children, ...props }: ComponentProps<"form"> & { pending?: boolean }) {
  return (
    <form {...props} aria-busy={pending || undefined}>
      <fieldset disabled={pending} className="m-0 min-w-0 border-0 p-0">
        {children}
      </fieldset>
    </form>
  );
}

export function TextField({
  label,
  hint,
  error,
  required,
  className,
  reveal,
  type,
  ...props
}: FieldBase & Omit<ComponentProps<"input">, "className"> & { reveal?: boolean }) {
  const generated = useId();
  const id = props.id ?? generated;
  const [visible, setVisible] = useState(false);
  return (
    <FieldShell {...{ id, label, hint, error, required, className }}>
      <div className="relative">
        <Input
          {...props}
          id={id}
          type={reveal && visible ? "text" : type}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy(id, hint, error)}
          className={cn("h-[38px]", reveal && "pr-10")}
        />
        {reveal && (
          <button
            type="button"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? <EyeOff aria-hidden className="size-[18px]" /> : <Eye aria-hidden className="size-[18px]" />}
          </button>
        )}
      </div>
    </FieldShell>
  );
}

// shortcut: native <select> keeps the steps' onChange handlers as they are, upgrade to the shadcn Select when the steps move to react-hook-form
export function SelectField({
  label,
  hint,
  error,
  required,
  className,
  placeholder,
  options,
  ...props
}: FieldBase &
  Omit<ComponentProps<"select">, "className"> & { placeholder?: string; options: readonly { value: string; label: string }[] }) {
  const generated = useId();
  const id = props.id ?? generated;
  return (
    <FieldShell {...{ id, label, hint, error, required, className }}>
      <select
        {...props}
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(
          "h-[38px] w-full rounded-md border border-input bg-card px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive",
          !props.value && "text-muted-foreground",
        )}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function CheckboxField({
  label,
  error,
  className,
  ...props
}: Omit<ComponentProps<"input">, "type" | "className"> & { label: ReactNode; error?: string; className?: string }) {
  const generated = useId();
  const id = props.id ?? generated;
  return (
    <div className={className}>
      <label htmlFor={id} className="inline-flex cursor-pointer items-start gap-2.5 text-[13px] leading-5">
        <input
          {...props}
          id={id}
          type="checkbox"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 size-4 flex-none accent-primary"
        />
        <span>{label}</span>
      </label>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs leading-4 text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** Drag-and-drop file area with a "Browse files" button (screen 43d). */
export function FileDropField({
  label,
  hint,
  error,
  accept,
  helpText,
  file,
  onFile,
  disabled,
}: {
  label: string;
  hint?: string;
  error?: string;
  accept: string;
  helpText: string;
  file: File | null;
  onFile: (file: File | null) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) onFile(dropped);
  };
  return (
    <div className="flex flex-col gap-0.5">
      <p id={`${id}-label`} className="text-[13px] leading-[18px] font-semibold">
        {label}
      </p>
      {hint && <p className="text-[11px] leading-4 text-muted-foreground">{hint}</p>}
      <div
        className={cn(
          "mt-1.5 flex flex-col items-center gap-1 rounded-md border border-dashed border-input bg-sunken px-4 py-5 text-center",
          dragging && "border-primary bg-purple-50",
          error && "border-destructive",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <UploadCloud aria-hidden className="size-[22px] text-muted-foreground" />
        {file ? (
          <>
            <p className="text-[13px] font-semibold">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
          </>
        ) : (
          <>
            <p className="text-[13px] font-semibold">Drag and drop your file here</p>
            <p className="text-xs text-muted-foreground">{helpText}</p>
          </>
        )}
        <div className="mt-1 flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            aria-describedby={`${id}-label`}
            onClick={() => input.current?.click()}
          >
            {file ? "Replace file" : "Browse files"}
          </Button>
          {file && (
            <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => onFile(null)} aria-label={`Remove ${file.name}`}>
              Remove
            </Button>
          )}
        </div>
        <input
          ref={input}
          type="file"
          accept={accept}
          hidden
          aria-labelledby={`${id}-label`}
          onChange={(e) => {
            onFile(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />
      </div>
      {error && <p className="text-xs leading-4 text-destructive">{error}</p>}
    </div>
  );
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
