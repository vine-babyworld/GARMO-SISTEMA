import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type FreightRules = {
  pequeno: number;
  medio: number;
  grande: number;
  extra_grande: number;
};

const freightRulesRef = doc(db, "settings", "freightRules");

export async function fetchFreightSettings(): Promise<FreightRules> {
  const snapshot = await getDoc(freightRulesRef);

  if (!snapshot.exists()) {
    return {
      pequeno: 19,
      medio: 44.95,
      grande: 81,
      extra_grande: 108,
    };
  }

  const data = snapshot.data();

  return {
    pequeno: Number(data.pequeno ?? 19),
    medio: Number(data.medio ?? 44.95),
    grande: Number(data.grande ?? 81),
    extra_grande: Number(data.extra_grande ?? 108),
  };
}

export async function saveFreightSettings(settings: FreightRules): Promise<void> {
  await setDoc(
    freightRulesRef,
    {
      ...settings,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}