import { redirect } from "next/navigation";
import { zalogowanyEmail } from "@/lib/bruno/auth";
import LoginForm from "@/components/bruno/login-form";

export const dynamic = "force-dynamic";

export default async function BrunoLoginPage() {
  if (await zalogowanyEmail()) redirect("/bruno/panel");
  return (
    <div className="max-w-md mx-auto">
      <h1 className="bruno-h1 text-[2rem] sm:text-[2.6rem] text-center mb-8">Zaloguj się</h1>
      <LoginForm />
    </div>
  );
}
