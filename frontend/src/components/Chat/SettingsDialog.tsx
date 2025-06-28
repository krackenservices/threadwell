import React, { useEffect, useState } from "react";
import { getSettings, updateSettings } from "@/api";
import type { Settings } from "@/types.ts";
import { Button } from "@/components/ui/button";

export const SettingsDialog: React.FC<{ onClose: () => void }> = ({
                                                                      onClose,
                                                                  }) => {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getSettings().then(setSettings).catch(console.error);
    }, []);

    const handleChange = (key: keyof Settings, value: string | boolean) => {
        if (!settings) return;
        setSettings({ ...settings, [key]: value });
    };

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            await updateSettings(settings);
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const inputStyles =
        "w-full rounded-md border bg-input p-2 text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="p-8 bg-background text-foreground border rounded-lg shadow-xl w-[550px]"
                onClick={(e) => e.stopPropagation()}
            >
                {!settings ? (
                    <div className="p-4">Loading...</div>
                ) : (
                    <>
                        <h2 className="text-xl font-bold mb-6">Settings</h2>
                        <div className="space-y-4">
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    className="size-4 rounded accent-primary"
                                    checked={settings.simulate_only}
                                    onChange={(e) =>
                                        handleChange("simulate_only", e.target.checked)
                                    }
                                />
                                Simulate Only (no live LLM)
                            </label>

                            <label className="block space-y-1.5">
                <span className="text-sm font-medium text-muted-foreground">
                  LLM Provider
                </span>
                                <input
                                    type="text"
                                    value={settings.llm_provider}
                                    onChange={(e) => handleChange("llm_provider", e.target.value)}
                                    className={inputStyles}
                                />
                            </label>

                            <label className="block space-y-1.5">
                <span className="text-sm font-medium text-muted-foreground">
                  Model Name
                </span>
                                <input
                                    type="text"
                                    value={settings.llm_model}
                                    onChange={(e) => handleChange("llm_model", e.target.value)}
                                    className={inputStyles}
                                />
                            </label>

                            <label className="block space-y-1.5">
                <span className="text-sm font-medium text-muted-foreground">
                  Endpoint
                </span>
                                <input
                                    type="text"
                                    value={settings.llm_endpoint}
                                    onChange={(e) => handleChange("llm_endpoint", e.target.value)}
                                    className={inputStyles}
                                />
                            </label>

                            <label className="block space-y-1.5">
                <span className="text-sm font-medium text-muted-foreground">
                  API Key
                </span>
                                <input
                                    type="password"
                                    value={settings.llm_api_key || ""}
                                    onChange={(e) => handleChange("llm_api_key", e.target.value)}
                                    className={inputStyles}
                                />
                            </label>
                        </div>
                        <div className="flex justify-end gap-4 mt-8">
                            <Button variant="secondary" onClick={onClose} disabled={saving}>
                                Cancel
                            </Button>
                            <Button size="lg" onClick={handleSave} disabled={saving}>
                                {saving ? "Saving..." : "Save"}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};