"use client";
import { Button, CheckboxField, FileDropField, Form, Heading, Text } from "@/components/ui";
import { ACCEPT_ATTRIBUTE, type FieldErrors } from "../model/validation";
import { DOCUMENTS, type DocumentField } from "../model/types";

/** Screen 43d, "Documents". */
export function DocumentsStep({
  files,
  declared,
  errors,
  formError,
  pending,
  onFile,
  onDeclared,
  onBack,
  onSubmit,
}: {
  files: Record<DocumentField, File | null>;
  declared: boolean;
  errors: FieldErrors;
  formError?: string;
  pending: boolean;
  onFile: (field: DocumentField, file: File | null) => void;
  onDeclared: (value: boolean) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
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
        <Heading level={1} id="documents-title" className="onboarding-title" tabIndex={-1}>
          Documents
        </Heading>
        <Text className="onboarding-subtitle">
          Operations verifies these before your profile goes live. PDF or image, up to 10 MB each.
        </Text>
      </div>
      <div className="onboarding-documents">
        {DOCUMENTS.map((doc) => (
          <FileDropField
            key={doc.field}
            label={doc.label}
            hint={doc.hint}
            accept={ACCEPT_ATTRIBUTE}
            helpText="PDF, DOC, PPT, JPG or PNG · up to 10 MB"
            file={files[doc.field]}
            onFile={(file) => onFile(doc.field, file)}
            error={errors[doc.field]}
            disabled={pending}
          />
        ))}
      </div>
      <CheckboxField
        label="I confirm these documents are mine and agree to the tutor terms"
        checked={declared}
        onChange={(e) => onDeclared(e.target.checked)}
        error={errors.declarationAccepted}
      />
      {formError && (
        <p className="ui-field-error onboarding-form-error" role="alert">
          {formError}
        </p>
      )}
      <div className="onboarding-actions">
        <Button type="submit" disabled={pending} aria-busy={pending || undefined}>
          {pending ? "Submitting…" : "Submit application"}
        </Button>
        <Button variant="ghost" className="onboarding-back" onClick={onBack} disabled={pending}>
          Back
        </Button>
      </div>
    </Form>
  );
}
