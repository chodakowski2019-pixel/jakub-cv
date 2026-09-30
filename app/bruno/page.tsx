import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import LoginForm from "@/components/bruno/login-form";

export const dynamic = "force-dynamic";

export default async function BrunoLoginPage() {
  if (await zalogowanyEmail()) redirect("/bruno/panel");
  return (
    <div className="max-w-md mx-auto">
      <h1 className="bruno-h1 text-[2rem] sm:text-[2.6rem] text-center mb-3">
        Zaloguj się do <span className="bruno-gradient-tekst">Bruno AI</span>
      </h1>
      <p className="text-center text-slate-600 mb-8">Podaj firmowy adres e-mail. Wyślemy 6-cyfrowy kod, bez hasła.</p>
      <LoginForm />
    </div>
  );
}
