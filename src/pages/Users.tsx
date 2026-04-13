import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUsers } from "@/hooks/useUsers";

export default function UsersPage() {
  const { users, loading, addUser } = useUsers();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  async function handleAdd() {
    if (!name || !email) return;

    await addUser({
        name,
        email,
        role: "operador",
        company: "BABY WORLD",
        isActive: true,
        });

    setName("");
    setEmail("");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Usuários</h1>

      {/* Cadastro */}
      <div className="flex gap-2">
        <Input
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button onClick={handleAdd}>Adicionar</Button>
      </div>

      {/* Lista */}
      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="p-3 border rounded-lg flex justify-between"
            >
              <div>
                <p className="font-medium">{u.name}</p>
                <p className="text-sm text-muted-foreground">{u.email}</p>
              </div>
              <span className="text-xs">{u.role}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}