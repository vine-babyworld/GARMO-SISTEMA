import { Construction } from "lucide-react";

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 animate-fade-in">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
        <Construction className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="text-xl font-bold text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground">Este módulo está em desenvolvimento.</p>
    </div>
  );
}
