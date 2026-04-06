import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const COLLECTION_NAME = "devolucoes";

export async function getDevolucoes() {
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

export async function addDevolucao(data: Record<string, unknown>) {
  return addDoc(collection(db, COLLECTION_NAME), {
    ...data,
    createdAt: new Date().toISOString(),
  });
}

export async function updateDevolucao(
  id: string,
  data: Record<string, unknown>
) {
  return updateDoc(doc(db, COLLECTION_NAME, id), data);
}

export async function deleteDevolucao(id: string) {
  return deleteDoc(doc(db, COLLECTION_NAME, id));
}