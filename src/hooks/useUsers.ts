import { useCallback, useEffect, useState } from "react";
import {
  createUser,
  editUser,
  fetchUsers,
  type AppUser,
} from "../lib/usersFirestore";

export function useUsers() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function addUser(user: Omit<AppUser, "id">) {
    await createUser(user);
    await loadUsers();
  }

  async function updateUser(
    userId: string,
    patch: Partial<Omit<AppUser, "id">>
  ) {
    await editUser(userId, patch);
    await loadUsers();
  }

  return {
    users,
    loading,
    addUser,
    updateUser,
    reloadUsers: loadUsers,
  };
}