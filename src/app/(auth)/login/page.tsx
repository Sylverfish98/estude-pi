import { AuthForm, AuthLink } from "@/components/auth-form";
import { loginAction } from "@/lib/actions/auth";

export default function LoginPage() {
  return (
    <AuthForm
      title="Login"
      action={loginAction}
      submitLabel="Entrar"
      fields={[
        { name: "username", label: "Usuário", autoComplete: "username" },
        { name: "password", label: "Senha", type: "password", autoComplete: "current-password" },
      ]}
      footer={
        <>
          Não tem uma conta? <AuthLink href="/register">Crie uma aqui</AuthLink>
        </>
      }
    />
  );
}
