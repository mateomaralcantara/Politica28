import CrmShell from "@/components/CrmShell";
import { esModoDemo } from "@/lib/inscripcion/store";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return <CrmShell modoDemo={esModoDemo()}>{children}</CrmShell>;
}
