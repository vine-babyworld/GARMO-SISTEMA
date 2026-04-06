import { useEffect, useState } from "react";
import { Save, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchFreightSettings,
  saveFreightSettings,
} from "@/lib/settingsFirestore";

type FreightSettings = {
  pequeno: string;
  medio: string;
  grande: string;
  extra_grande: string;
};

function parseDecimal(value: string) {
  const normalized = value.replace(",", ".").trim();
  if (normalized === "") return NaN;
  return Number(normalized);
}

function formatDecimal(value: number) {
  return String(value).replace(".", ",");
}

export default function FreightSettingsPage() {
  const [freightSettings, setFreightSettings] = useState<FreightSettings>({
    pequeno: "19",
    medio: "44,95",
    grande: "81",
    extra_grande: "108",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FreightSettings, string>>>({});
  const [savedMessage, setSavedMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const data = await fetchFreightSettings();

        setFreightSettings({
          pequeno: formatDecimal(data.pequeno),
          medio: formatDecimal(data.medio),
          grande: formatDecimal(data.grande),
          extra_grande: formatDecimal(data.extra_grande),
        });
      } catch (error) {
        console.error("Erro ao carregar configurações de frete:", error);
        setSavedMessage("Não foi possível carregar as configurações salvas.");
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  function handleChange(field: keyof FreightSettings, value: string) {
    setFreightSettings((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));

    setSavedMessage("");
  }

  function validate() {
    const newErrors: Partial<Record<keyof FreightSettings, string>> = {};

    (Object.keys(freightSettings) as Array<keyof FreightSettings>).forEach((key) => {
      const value = parseDecimal(freightSettings[key]);

      if (freightSettings[key].trim() === "" || Number.isNaN(value) || value < 0) {
        newErrors[key] = "Informe um valor válido";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    const isValid = validate();
    if (!isValid || saving) return;

    try {
      setSaving(true);
      setSavedMessage("");

      await saveFreightSettings({
        pequeno: parseDecimal(freightSettings.pequeno),
        medio: parseDecimal(freightSettings.medio),
        grande: parseDecimal(freightSettings.grande),
        extra_grande: parseDecimal(freightSettings.extra_grande),
      });

      setSavedMessage("Configurações salvas com sucesso.");
    } catch (error) {
      console.error("Erro ao salvar configurações de frete:", error);
      setSavedMessage("Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  }

  function renderError(error?: string) {
    if (!error) return null;
    return <p className="mt-1 text-xs text-destructive">{error}</p>;
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Configurações de Frete
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Defina os valores médios de frete por porte para usar na precificação automática.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Truck className="h-5 w-5 text-primary" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Frete médio
            </h2>
            <p className="text-sm text-muted-foreground">
              Ajuste os valores médios conforme a operação da empresa.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-sm text-muted-foreground">
            Carregando configurações...
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Pequeno
                </label>
                <Input
                  inputMode="decimal"
                  value={freightSettings.pequeno}
                  onChange={(e) => handleChange("pequeno", e.target.value)}
                  placeholder="0,00"
                />
                {renderError(errors.pequeno)}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Médio
                </label>
                <Input
                  inputMode="decimal"
                  value={freightSettings.medio}
                  onChange={(e) => handleChange("medio", e.target.value)}
                  placeholder="0,00"
                />
                {renderError(errors.medio)}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Grande
                </label>
                <Input
                  inputMode="decimal"
                  value={freightSettings.grande}
                  onChange={(e) => handleChange("grande", e.target.value)}
                  placeholder="0,00"
                />
                {renderError(errors.grande)}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Extra Grande
                </label>
                <Input
                  inputMode="decimal"
                  value={freightSettings.extra_grande}
                  onChange={(e) => handleChange("extra_grande", e.target.value)}
                  placeholder="0,00"
                />
                {renderError(errors.extra_grande)}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Button onClick={handleSave} className="gap-2" disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? "Salvando..." : "Salvar configurações"}
              </Button>

              {savedMessage && (
                <span className="text-sm text-muted-foreground">
                  {savedMessage}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}