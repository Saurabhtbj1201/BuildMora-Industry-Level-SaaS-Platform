import ServiceForm from "@/components/services/ServiceForm";
export const metadata = { title: "New Service" };
export default function NewServicePage() {
  return <ServiceForm mode="create" />;
}
