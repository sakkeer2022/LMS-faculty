"use client";
import { useId, useRef, useState, type ComponentProps, type DragEvent, type ReactNode } from "react";
import { cx } from "./utils";

/* Form controls for the onboarding and portal screens (styles: ui.css, .ui-field*). Native
   inputs live only here (UI lint). Each field links its label, hint and error. */

type FieldBase = {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
};

function describedBy(id: string, hint?: string, error?: string) {
  return [error ? `${id}-error` : undefined, hint && !error ? `${id}-hint` : undefined].filter(Boolean).join(" ") || undefined;
}

function FieldShell({ id, label, hint, error, required, className, children }: FieldBase & { id: string; children: ReactNode }) {
  return (
    <div className={cx("ui-field", className)}>
      <label className="ui-field-label" htmlFor={id}>
        {label}
        {required && (
          <span className="ui-field-required" aria-hidden>
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="ui-field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="ui-field-error">
          {error}
        </p>
      )}
    </div>
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
      <div className="ui-field-control" data-invalid={Boolean(error)}>
        <input
          {...props}
          id={id}
          type={reveal && visible ? "text" : type}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy(id, hint, error)}
        />
        {reveal && (
          <button
            type="button"
            className="ui-field-reveal"
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            onClick={() => setVisible((v) => !v)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/auth/icon-eye.svg" alt="" width={18} height={18} />
          </button>
        )}
      </div>
    </FieldShell>
  );
}

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
      <div className="ui-field-control ui-field-control--select" data-invalid={Boolean(error)} data-empty={!props.value}>
        <select {...props} id={id} required={required} aria-invalid={Boolean(error)} aria-describedby={describedBy(id, hint, error)}>
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
        <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" className="ui-field-chevron">
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
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
    <div className={cx("ui-check", className)}>
      <label className="ui-check-label" htmlFor={id}>
        <input {...props} id={id} type="checkbox" aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />
        <span>{label}</span>
      </label>
      {error && (
        <p id={`${id}-error`} className="ui-field-error">
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
    <div className="ui-file">
      <p className="ui-file-label" id={`${id}-label`}>
        {label}
      </p>
      {hint && <p className="ui-file-hint">{hint}</p>}
      <div
        className="ui-file-drop"
        data-dragging={dragging}
        data-invalid={Boolean(error)}
        data-filled={Boolean(file)}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" className="ui-file-icon">
          <path d="M12 16V4m0 0l-5 5m5-5l5 5M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {file ? (
          <>
            <p className="ui-file-title">{file.name}</p>
            <p className="ui-file-help">{formatBytes(file.size)}</p>
          </>
        ) : (
          <>
            <p className="ui-file-title">Drag and drop your file here</p>
            <p className="ui-file-help">{helpText}</p>
          </>
        )}
        <div className="ui-file-actions">
          <button
            type="button"
            className="ui-file-browse"
            disabled={disabled}
            aria-describedby={`${id}-label`}
            onClick={() => input.current?.click()}
          >
            {file ? "Replace file" : "Browse files"}
          </button>
          {file && (
            <button type="button" className="ui-file-remove" disabled={disabled} onClick={() => onFile(null)} aria-label={`Remove ${file.name}`}>
              Remove
            </button>
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
      {error && <p className="ui-field-error">{error}</p>}
    </div>
  );
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
