import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-60 min-h-screen p-6 transition-all duration-300">
        <Outlet />
      </main>
    </div>
  );
}
