"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import type { ActionState } from "@/lib/errors";
import { btn, cx } from "./ui";

export function SubmitButton({ children, variant = "primary", className, pendingText = "Enviando…", name, value }: {
  children: ReactNode;
  variant?: keyof typeof btn;
  className?: string;
  pendingText?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" name={name} value={value} disabled={pending} aria-disabled={pending} className={cx(btn[variant], className)}>
      {pending ? pendingText : children}
    </button>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  if (state.error)
    return (
      <p role="alert" className="rounded-xl border border-danger/40 bg-danger/5 px-4 py-3 text-sm font-medium text-danger">
        {state.error}
      </p>
    );
  if (state.message)
    return (
      <p role="status" className="rounded-xl border border-success/40 bg-success/10 px-4 py-3 text-sm font-medium text-success">
        {state.message}
      </p>
    );
  return null;
}

export function FieldError({ state, name }: { state: ActionState; name: string }) {
  const msg = state.fieldErrors?.[name];
  if (!msg) return null;
  return (
    <p id={`${name}-error`} className="mt-1 text-sm font-medium text-danger">
      {msg}
    </p>
  );
}

export const invalid = (state: ActionState, name: string) =>
  state.fieldErrors?.[name] ? { "aria-invalid": true as const, "aria-describedby": `${name}-error` } : {};
