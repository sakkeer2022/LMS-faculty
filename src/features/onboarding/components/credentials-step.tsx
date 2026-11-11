"use client";
import Link from "next/link";
import { Button } from "@/components/shadcn/button";
import { useServedCountries } from "@/lib/regions";
import { Form, PhoneField, SelectField, TextField } from "./fields";
import { TEACHING_EXPERIENCE, type Credentials, type TeachingMode } from "../model/types";
import type { FieldErrors } from "../model/validation";

/**
 * Screen 43b, "Your credentials". In a re-upload (`mode="reupload"`) the account already exists, so the
 * password fields are not shown and the answers on file are filled in.
 */
export function CredentialsStep({
  values,
  errors,
  teachingModes,
  mode = "apply",
  onChange,
  onContinue,
}: {
  values: Credentials;
  errors: FieldErrors;
  teachingModes: readonly TeachingMode[];
  mode?: "apply" | "reupload";
  onChange: (values: Credentials) => void;
  onContinue: () => void;
}) {
  const countries = useServedCountries();
  const set = (key: keyof Credentials) => (event: { target: { value: string } }) =>
    onChange({ ...values, [key]: event.target.value });
  return (
    <Form
      className="onboarding-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onContinue();
      }}
      aria-labelledby="credentials-title"
    >
      <div className="onboarding-head">
        <h1 id="credentials-title" className="onboarding-title" tabIndex={-1}>
          Your credentials
        </h1>
        <p className="onboarding-subtitle">
          We verify every tutor before they appear in search. This usually takes 3–5 working days.
        </p>
      </div>
      <div className="onboarding-grid">
        <TextField
          className="onboarding-span"
          label="Full name"
          name="fullName"
          required
          autoComplete="name"
          placeholder="As printed on your PAN"
          value={values.fullName}
          onChange={set("fullName")}
          error={errors.fullName}
        />
        {mode === "apply" && (
          <>
            <TextField
              label="Password"
              name="password"
              type="password"
              reveal
              required
              autoComplete="new-password"
              placeholder="Create a password"
              value={values.password}
              onChange={set("password")}
              error={errors.password}
              hint="At least 8 characters, including a number."
            />
            <TextField
              label="Confirm password"
              name="confirmPassword"
              type="password"
              reveal
              required
              autoComplete="new-password"
              placeholder="Confirm your password"
              value={values.confirmPassword}
              onChange={set("confirmPassword")}
              error={errors.confirmPassword}
            />
          </>
        )}
        <PhoneField
          label="Phone"
          name="mobileNumber"
          required
          countries={countries}
          value={values.mobileNumber}
          onChange={(mobileNumber) => onChange({ ...values, mobileNumber })}
          hint="We send session alerts here."
          error={errors.mobileNumber}
        />
        <TextField
          label="City"
          name="city"
          autoComplete="address-level2"
          placeholder="Bengaluru"
          value={values.city}
          onChange={set("city")}
          error={errors.city}
        />
        <TextField
          label="Highest qualification"
          name="highestQualification"
          required
          placeholder="M.Sc. Physics"
          value={values.highestQualification}
          onChange={set("highestQualification")}
          error={errors.highestQualification}
        />
        <SelectField
          label="Years of teaching"
          name="teachingExperience"
          required
          placeholder="Select a range"
          options={TEACHING_EXPERIENCE}
          value={values.teachingExperience}
          onChange={set("teachingExperience")}
          error={errors.teachingExperience}
        />
        <SelectField
          className="onboarding-span"
          label="Preferred mode of teaching"
          name="teachingMode"
          required
          placeholder="Select a mode"
          options={teachingModes.map((m) => ({ value: m.code, label: m.name }))}
          value={values.teachingMode}
          onChange={set("teachingMode")}
          error={errors.teachingMode}
        />
        <TextField
          className="onboarding-span"
          label="Where did you study?"
          name="studiedAt"
          placeholder="University or college"
          value={values.studiedAt}
          onChange={set("studiedAt")}
          hint="Shown on your public profile once verified."
          error={errors.studiedAt}
        />
      </div>
      <div className="onboarding-actions">
        <Button type="submit">Continue to subjects</Button>
        {mode === "apply" && (
          <Link href="/login" className="onboarding-back">
            Back
          </Link>
        )}
      </div>
    </Form>
  );
}
