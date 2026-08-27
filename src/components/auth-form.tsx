"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthState } from "@/lib/actions/auth";
import { FIELD, PRIMARY_BTN } from "@/components/ui";

type Action = (state: AuthState, formData: FormData) => Promise<AuthState>;

type Field = {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
};

type AuthFormProps = {
  title: string;
  action: Action;
  fields: Field[];
  submitLabel: string;
  footer: React.ReactNode;
};

export function AuthForm({ title, action, fields, submitLabel, footer }: AuthFormProps) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, {});

  return (
    <div className="brutal bg-cream p-4">
      <h1 className="mb-4 lg-heading font-bold">{title}</h1>

      <form action={formAction} className="flex flex-col gap-3">
        {fields.map((field) => (
          <label key={field.name} className="flex flex-col gap-1">
            <span className="detail text-fg3">{field.label}:</span>
            <input
              name={field.name}
              type={field.type ?? "text"}
              autoComplete={field.autoComplete}
              className={FIELD}
              required
            />
          </label>
        ))}

        {state.error ? (
          <p role="alert" className="detail font-medium text-danger">
            {state.error}
          </p>
        ) : null}

        <button type="submit" disabled={pending} className={`${PRIMARY_BTN} mt-1`}>
          {pending ? "Aguarde..." : submitLabel}
        </button>
      </form>

      <p className="mt-4 text-center detail text-fg1">{footer}</p>
    </div>
  );
}

export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-medium text-orange-700 underline underline-offset-2">
      {children}
    </Link>
  );
}
