import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProjectForm } from "@/components/projects/ProjectForm";

export const metadata = {
  title: "New Project",
};

export default async function NewProjectPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="p-6">
      <ProjectForm />
    </div>
  );
}
