import React, { useEffect, useState } from "react";
import { getSettings, updateSettings,  } from "@/api";
import type { Settings } from '@/types.ts'

export const SettingsDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
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

    if (!settings) return <div className="p-4">Loading...</div>;

    return (
        <div className="p-4 bg-background text-foreground border rounded w-[400px]">
            <h2 className="text-lg font-bold mb-2">Settings</h2>
            <label className="flex items-center gap-2 mt-4">
                <input
                    type="checkbox"
                    checked={settings.simulate_only}
                    onChange={(e) => handleChange("simulate_only", e.target.checked )}
                />
                Simulate Only (no live LLM)
            </label>
            <label className="block mb-2">
                LLM Provider
                <input
                    type="text"
                    value={settings.llm_provider}
                    onChange={(e) => handleChange("llm_provider", e.target.value)}
                    className="w-full border p-1 mt-1"
                />
            </label>
            <label className="block mb-2">
                Model Name
                <input
                    type="text"
                    value={settings.llm_model}
                    onChange={(e) => handleChange("llm_model", e.target.value)}
                    className="w-full border p-1 mt-1"
                />
            </label>
            <label className="block mb-2">
                Endpoint
                <input
                    type="text"
                    value={settings.llm_endpoint}
                    onChange={(e) => handleChange("llm_endpoint", e.target.value)}
                    className="w-full border p-1 mt-1"
                />
            </label>
            <label className="block mb-4">
                API Key
                <input
                    type="password"
                    value={settings.llm_api_key || ""}
                    onChange={(e) => handleChange("llm_api_key", e.target.value)}
                    className="w-full border p-1 mt-1"
                />
            </label>
            <div className="flex justify-end gap-2">
                <button onClick={onClose} disabled={saving} className="underline">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="bg-blue-500 text-white px-4 py-1 rounded">
                    Save
                </button>
            </div>
        </div>
    );
};
