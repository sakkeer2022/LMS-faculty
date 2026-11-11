"use client";
import { FileText } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { CheckboxField, FileDropField, Form, formatBytes } from "./fields";
import { ACCEPT_ATTRIBUTE, type FieldErrors } from "../model/validation";
import { ADDITIONAL_DOCUMENTS, DOCUMENTS, FIELD_OF_TYPE, type DocumentField, type ReuploadDocument } from "../model/types";

/**
 * Screen 43d, "Documents": the three required documents, then up to five optional additional documents
 * (certificates, experience letters…) in the same kind of drop area. In a re-upload the documents on file
 * are shown: a required one is kept unless the tutor uploads a replacement, an additional one can be removed.
 */
export function DocumentsStep({
  files,
  additionalFiles,
  declared,
  errors,
  formError,
  pending,
  onFile,
  onAdditionalFiles,
  onDeclared,
  onBack,
  onSubmit,
  documentsOnFile = [],
  removedIds = [],
  onRemoveOnFile,
  submitLabel = "Submit application",
}: {
  files: Record<DocumentField, File | null>;
  additionalFiles: File[];
  declared: boolean;
  errors: FieldErrors;
  formError?: string;
  pending: boolean;
  onFile: (field: DocumentField, file: File | null) => void;
  onAdditionalFiles: (files: File[]) => void;
  onDeclared: (value: boolean) => void;
  onBack: () => void;
  onSubmit: () => void;
  /** Re-upload: the documents already on record */
  documentsOnFile?: readonly ReuploadDocument[];
  /** Re-upload: additional documents on record the tutor removed */
  removedIds?: readonly string[];
  onRemoveOnFile?: (id: string, removed: boolean) => void;
  submitLabel?: string;
}) {
  const extrasOnFile = documentsOnFile.filter((d) => !d.required);
  const keptExtras = extrasOnFile.filter((d) => !removedIds.includes(d.id)).length;
  const room = ADDITIONAL_DOCUMENTS.max - keptExtras - additionalFiles.length;
  const onFileFor = (field: DocumentField) => documentsOnFile.find((d) => d.required && FIELD_OF_TYPE[d.type] === field);

  return (
    <Form
      className="onboarding-form"
      noValidate
      pending={pending}
      aria-labelledby="documents-title"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="onboarding-head">
        <h1 id="documents-title" className="onboarding-title" tabIndex={-1}>
          Documents
        </h1>
        <p className="onboarding-subtitle">
          Operations verifies these before your profile goes live. PDF or image, up to 10 MB each.
        </p>
      </div>
      <div className="onboarding-documents">
        {DOCUMENTS.map((doc) => {
          const current = onFileFor(doc.field);
          return (
            <FileDropField
              key={doc.field}
              label={doc.label}
              hint={
                current && !files[doc.field]
                  ? `On file: ${current.fileName} (${formatBytes(current.fileSize)}). Upload a new file only to replace it.`
                  : doc.hint
              }
              accept={ACCEPT_ATTRIBUTE}
              helpText="PDF, DOC, PPT, JPG or PNG · up to 10 MB"
              file={files[doc.field]}
              onFile={(file) => onFile(doc.field, file)}
              error={errors[doc.field]}
              disabled={pending}
            />
          );
        })}

        <div className="flex flex-col gap-2">
          <FileDropField
            label="Additional documents (optional)"
            hint={`Certificates, experience letters or anything else that supports your application. Up to ${ADDITIONAL_DOCUMENTS.max}.`}
            accept={ACCEPT_ATTRIBUTE}
            helpText={room > 0 ? `PDF, DOC, PPT, JPG or PNG · up to 10 MB · ${room} more allowed` : "You have added the maximum number of documents"}
            file={null}
            onFile={(file) => file && room > 0 && onAdditionalFiles([...additionalFiles, file])}
            error={errors[ADDITIONAL_DOCUMENTS.field]}
            disabled={pending || room <= 0}
          />
          {(extrasOnFile.length > 0 || additionalFiles.length > 0) && (
            <ul className="flex flex-col gap-1.5" aria-label="Additional documents">
              {extrasOnFile.map((doc) => {
                const removed = removedIds.includes(doc.id);
                return (
                  <li key={doc.id} className="onboarding-extra" data-removed={removed || undefined}>
                    <FileText aria-hidden className="size-4 flex-none text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate" title={doc.fileName}>
                      {doc.fileName} <span className="text-muted-foreground">· {formatBytes(doc.fileSize)} · on file</span>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={pending || (removed && room <= 0)}
                      onClick={() => onRemoveOnFile?.(doc.id, !removed)}
                      aria-label={removed ? `Keep ${doc.fileName}` : `Remove ${doc.fileName}`}
                    >
                      {removed ? "Undo" : "Remove"}
                    </Button>
                  </li>
                );
              })}
              {additionalFiles.map((file, index) => (
                <li key={`${file.name}-${index}`} className="onboarding-extra">
                  <FileText aria-hidden className="size-4 flex-none text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate" title={file.name}>
                    {file.name} <span className="text-muted-foreground">· {formatBytes(file.size)}</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => onAdditionalFiles(additionalFiles.filter((_, i) => i !== index))}
                    aria-label={`Remove ${file.name}`}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <CheckboxField
        label="I confirm these documents are mine and agree to the tutor terms"
        checked={declared}
        onChange={(e) => onDeclared(e.target.checked)}
        error={errors.declarationAccepted}
      />
      {formError && (
        <p className="text-xs leading-4 text-destructive onboarding-form-error" role="alert">
          {formError}
        </p>
      )}
      <div className="onboarding-actions">
        <Button type="submit" disabled={pending} aria-busy={pending || undefined}>
          {pending ? "Submitting…" : submitLabel}
        </Button>
        <Button type="button" variant="ghost" className="onboarding-back" onClick={onBack} disabled={pending}>
          Back
        </Button>
      </div>
    </Form>
  );
}
