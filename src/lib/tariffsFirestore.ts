import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface ChannelTariff {
  name: string;
  commissionRate: number;
  fixedFee?: number;
}

export interface TariffsConfig {
  babyWorld: ChannelTariff[];
  mpBabyStore: ChannelTariff[];
  updatedAt?: unknown;
}

const TARIFFS_DOC = doc(db, "config", "tariffs");

const DEFAULT_TARIFFS: Omit<TariffsConfig, "updatedAt"> = {
  babyWorld: [
    { name: "MELI PREMIUM",   commissionRate: 0.165 },
    { name: "MELI CLÁSSICO",  commissionRate: 0.125 },
    { name: "MAGALU",         commissionRate: 0.128 },
    { name: "AMAZON",         commissionRate: 0.13  },
    { name: "SHOPEE",         commissionRate: 0.14, fixedFee: 16 },
    { name: "IFOOD",          commissionRate: 0.14  },
    { name: "VIA VAREJO",     commissionRate: 0.17  },
    { name: "SHEIN",          commissionRate: 0.16  },
    { name: "TIKTOK",         commissionRate: 0.15  },
    { name: "JAMBLE",         commissionRate: 0.14  },
    { name: "VENDA DIRETA",   commissionRate: 0.05  },
  ],
  mpBabyStore: [
    { name: "MELI PREMIUM",  commissionRate: 0.165 },
    { name: "MELI CLÁSSICO", commissionRate: 0.115 },
    { name: "AMAZON",        commissionRate: 0.13  },
    { name: "SHOPEE",        commissionRate: 0.155, fixedFee: 16 },
    { name: "SITE",          commissionRate: 0.105 },
    { name: "VENDA DIRETA",  commissionRate: 0     },
  ],
};

export async function fetchTariffs(): Promise<TariffsConfig> {
  const snapshot = await getDoc(TARIFFS_DOC);
  if (!snapshot.exists()) {
    return DEFAULT_TARIFFS;
  }
  const data = snapshot.data() as TariffsConfig;
  return {
    babyWorld:    data.babyWorld    ?? DEFAULT_TARIFFS.babyWorld,
    mpBabyStore:  data.mpBabyStore  ?? DEFAULT_TARIFFS.mpBabyStore,
    updatedAt:    data.updatedAt,
  };
}

export async function saveTariffs(
  tariffs: Omit<TariffsConfig, "updatedAt">
): Promise<void> {
  await setDoc(TARIFFS_DOC, {
    ...tariffs,
    updatedAt: serverTimestamp(),
  });
}