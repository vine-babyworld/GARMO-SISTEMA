import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type AppUserRole = "admin" | "gestor" | "operador";
export type AppUserCompany = "BABY WORLD" | "MP BABY STORE";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: AppUserRole;
  company: AppUserCompany;
  isActive: boolean;
};

const usersRef = collection(db, "users");

export async function fetchUsers(): Promise<AppUser[]> {
  const q = query(usersRef, orderBy("name"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => {
    const data = d.data();

    return {
      id: d.id,
      name: String(data.name ?? ""),
      email: String(data.email ?? ""),
      role: (data.role ?? "operador") as AppUserRole,
      company: (data.company ?? "BABY WORLD") as AppUserCompany,
      isActive: Boolean(data.isActive),
    };
  });
}

export async function createUser(user: Omit<AppUser, "id">) {
  await addDoc(usersRef, {
    ...user,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function editUser(
  userId: string,
  patch: Partial<Omit<AppUser, "id">>
) {
  const ref = doc(db, "users", userId);
  await updateDoc(ref, {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}