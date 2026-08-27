import { AuthForm, AuthLink } from "@/components/auth-form";
import { registerAction } from "@/lib/actions/auth";

export default function RegisterPage() {
  return (
    <AuthForm
      title="Registrar"
      action={registerAction}
      submitLabel="Criar conta"
      fields={[
        { name: "username", label: "Nome de Usuário", autoComplete: "username" },
        { name: "password", label: "Senha", type: "password", autoComplete: "new-password" },
        { name: "confirm", label: "Confirmação da Senha", type: "password", autoComplete: "new-password" },
      ]}
      footer={
        <>
          Já uma conta? <AuthLink href="/login">Entre aqui</AuthLink>
        </>
      }
    />
  );
}
