import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function testFirebaseWrite() {
  try {
    console.log("Iniciando teste Firebase...");

    const docRef = await addDoc(collection(db, "products"), {
      sku: "TESTE-LOCAL",
      name: "Produto vindo do React",
      cost: 20.5,
      icms: 0.04,
      ipi: 0,
      ncm: "00000000",
      supplier: "",
      createdAt: serverTimestamp(),
    });

    console.log("Documento criado com ID:", docRef.id);
    alert(`Firebase OK. Documento criado: ${docRef.id}`);
  } catch (error) {
    console.error("Erro Firebase:", error);
    alert(`Erro ao gravar no Firebase: ${String(error)}`);
  }
}