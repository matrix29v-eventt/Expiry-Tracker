import { redirect } from "next/navigation";
import { isAuthenticated } from "@/app/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isAuthenticated()) {
    redirect("/login");
  }

  return <>{children}</>;
}
