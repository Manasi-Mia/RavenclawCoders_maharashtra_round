import { redirect } from "next/navigation";

export default function ScriptsRedirectPage() {
  redirect("/dashboard/ai-studio?tab=library");
}
