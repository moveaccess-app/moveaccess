import { redirect } from "next/navigation";

// Redirect da rota antiga para nova estrutura
// /contracts agora redireciona para /assinaturas
export default function ContractsRedirectPage() {
  redirect("/assinaturas");
}
