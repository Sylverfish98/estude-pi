"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";

export type AuthState = { error?: string };

const usernameSchema = z.string().trim();
//  .min(3, "O usuário deve ter ao menos 3 caracteres.")
//  .max(20, "O usuário deve ter no máximo 20 caracteres.");

const passwordSchema = z.string();
//  .min(6, "A senha deve ter ao menos 6 caracteres.");

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = z
    .object({
      username: usernameSchema,
      password: passwordSchema,
      confirm: z.string(),
    })
    .safeParse({
      username: formData.get("username"),
      password: formData.get("password"),
      confirm: formData.get("confirm"),
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { username, password, confirm } = parsed.data;
  if (password !== confirm) {
    return { error: "As senhas não coincidem." };
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return { error: "Esse nome de usuário já está em uso." };
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { username, passwordHash } });
  await createSession(user.id);

  redirect("/");
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = z.object({ username: z.string().trim().min(1), password: z.string().min(1) }).safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Preencha o usuário e a senha." };
  }

  const { username, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Usuário ou senha incorretos." };
  }

  await createSession(user.id);
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
