import OSProjectForm from "@/components/open-source/OSProjectForm";

export const metadata = { title: "New Open Source Project" };

export default function NewOSProjectPage() {
  return <OSProjectForm mode="create" />;
}
