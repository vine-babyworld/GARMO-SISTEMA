import { useCallback, useEffect, useState } from "react";
import {
  fetchTariffs,
  saveTariffs,
  type ChannelTariff,
  type TariffsConfig,
} from "@/lib/tariffsFirestore";

export function useTariffs() {
  const [tariffs, setTariffs] = useState<TariffsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadTariffs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTariffs();
      setTariffs(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTariffs();
  }, [loadTariffs]);

  const updateChannel = useCallback(
    (
      group: "babyWorld" | "mpBabyStore",
      index: number,
      patch: Partial<ChannelTariff>
    ) => {
      setTariffs((prev) => {
        if (!prev) return prev;
        const updated = [...prev[group]];
        updated[index] = { ...updated[index], ...patch };
        return { ...prev, [group]: updated };
      });
    },
    []
  );

  const addChannel = useCallback(
    (group: "babyWorld" | "mpBabyStore", channel: ChannelTariff) => {
      setTariffs((prev) => {
        if (!prev) return prev;
        return { ...prev, [group]: [...prev[group], channel] };
      });
    },
    []
  );

  const removeChannel = useCallback(
    (group: "babyWorld" | "mpBabyStore", index: number) => {
      setTariffs((prev) => {
        if (!prev) return prev;
        const updated = prev[group].filter((_, i) => i !== index);
        return { ...prev, [group]: updated };
      });
    },
    []
  );

  const save = useCallback(async () => {
    if (!tariffs) return;
    setSaving(true);
    try {
      await saveTariffs({
        babyWorld:   tariffs.babyWorld,
        mpBabyStore: tariffs.mpBabyStore,
      });
    } finally {
      setSaving(false);
    }
  }, [tariffs]);

  return {
    tariffs,
    loading,
    saving,
    updateChannel,
    addChannel,
    removeChannel,
    save,
    reload: loadTariffs,
  };
}