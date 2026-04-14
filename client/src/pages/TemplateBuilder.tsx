import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Palette,
  Layout,
  Type,
  Image,
  Save,
  Eye,
  Copy,
  Trash2,
  Plus,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  type: "minimal" | "standard" | "premium";
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  logo?: string;
  layout: "centered" | "sidebar" | "fullwidth";
  createdAt: number;
}

/**
 * TemplateBuilder Page
 * 
 * Drag-and-drop template builder for custom event branding,
 * preset templates, and compliance-aware customization.
 */
export default function TemplateBuilder() {
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: "1",
      name: "Minimal Event Page",
      type: "minimal",
      colors: {
        primary: "#FF4444",
        secondary: "#333333",
        accent: "#00AA00",
        background: "#FFFFFF",
      },
      fonts: { heading: "Space Grotesk", body: "Inter" },
      layout: "centered",
      createdAt: Date.now() - 2592000000,
    },
    {
      id: "2",
      name: "Standard Corporate",
      type: "standard",
      colors: {
        primary: "#0066FF",
        secondary: "#666666",
        accent: "#FF9900",
        background: "#F5F5F5",
      },
      fonts: { heading: "Montserrat", body: "Open Sans" },
      layout: "sidebar",
      createdAt: Date.now() - 1296000000,
    },
    {
      id: "3",
      name: "Premium Investor",
      type: "premium",
      colors: {
        primary: "#1A1A1A",
        secondary: "#4A4A4A",
        accent: "#FFD700",
        background: "#F9F9F9",
      },
      fonts: { heading: "Playfair Display", body: "Lato" },
      layout: "fullwidth",
      createdAt: Date.now() - 604800000,
    },
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    templates[0]
  );
  const [editMode, setEditMode] = useState(false);
  const [templateName, setTemplateName] = useState(selectedTemplate?.name || "");

  const presetTemplates = [
    {
      name: "Minimal",
      colors: {
        primary: "#FF4444",
        secondary: "#333333",
        accent: "#00AA00",
        background: "#FFFFFF",
      },
    },
    {
      name: "Dark Mode",
      colors: {
        primary: "#00D9FF",
        secondary: "#FFFFFF",
        accent: "#FF00FF",
        background: "#1A1A1A",
      },
    },
    {
      name: "Professional",
      colors: {
        primary: "#0066FF",
        secondary: "#666666",
        accent: "#FF9900",
        background: "#F5F5F5",
      },
    },
  ];

  const fontOptions = [
    "Space Grotesk",
    "Inter",
    "Montserrat",
    "Open Sans",
    "Playfair Display",
    "Lato",
    "Roboto",
    "Poppins",
  ];

  const handleSaveTemplate = () => {
    if (selectedTemplate) {
      setTemplates(
        templates.map((t) =>
          t.id === selectedTemplate.id
            ? { ...selectedTemplate, name: templateName }
            : t
        )
      );
      setEditMode(false);
      toast.success("Template saved");
    }
  };

  const handleDuplicateTemplate = (template: Template) => {
    const newTemplate: Template = {
      ...template,
      id: String(templates.length + 1),
      name: `${template.name} (Copy)`,
      createdAt: Date.now(),
    };

    setTemplates([newTemplate, ...templates]);
    setSelectedTemplate(newTemplate);
    toast.success("Template duplicated");
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter((t) => t.id !== id));
    setSelectedTemplate(null);
    toast.success("Template deleted");
  };

  const handleUpdateColor = (
    colorKey: keyof Template["colors"],
    value: string
  ) => {
    if (selectedTemplate) {
      setSelectedTemplate({
        ...selectedTemplate,
        colors: { ...selectedTemplate.colors, [colorKey]: value },
      });
    }
  };

  const handleApplyPreset = (preset: (typeof presetTemplates)[0]) => {
    if (selectedTemplate) {
      setSelectedTemplate({
        ...selectedTemplate,
        colors: preset.colors,
      });
      toast.success(`Applied ${preset.name} preset`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Event Branding Templates</h1>
        <p className="text-muted-foreground mt-1">
          Create custom event pages with drag-and-drop templates
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Template List */}
        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Layout className="h-4 w-4" />
              My Templates
            </h2>

            <div className="space-y-2 mb-4">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template);
                    setTemplateName(template.name);
                    setEditMode(false);
                  }}
                  className={`w-full text-left p-3 rounded border-2 transition-colors ${
                    selectedTemplate?.id === template.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  <p className="font-semibold text-sm">{template.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {template.type}
                  </p>
                  <div className="flex gap-1 mt-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: template.colors.primary }}
                    />
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: template.colors.secondary }}
                    />
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: template.colors.accent }}
                    />
                  </div>
                </button>
              ))}
            </div>

            <Button className="w-full flex items-center gap-2" size="sm">
              <Plus className="h-4 w-4" />
              New Template
            </Button>
          </Card>

          {/* Preset Templates */}
          <Card className="p-4">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Presets
            </h2>

            <div className="space-y-2">
              {presetTemplates.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handleApplyPreset(preset)}
                  className="w-full text-left p-3 border border-border rounded hover:bg-secondary transition-colors"
                >
                  <p className="font-semibold text-sm mb-2">{preset.name}</p>
                  <div className="flex gap-1">
                    {Object.values(preset.colors).map((color, idx) => (
                      <div
                        key={idx}
                        className="flex-1 h-6 rounded"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Template Editor */}
        {selectedTemplate && (
          <div className="lg:col-span-2 space-y-6">
            {/* Editor Controls */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Template Settings
                </h2>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditMode(!editMode)}
                  >
                    {editMode ? "Done" : "Edit"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveTemplate}
                    className="flex items-center gap-1"
                  >
                    <Save className="h-3 w-3" />
                    Save
                  </Button>
                </div>
              </div>

              {editMode && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded bg-background text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Layout
                    </label>
                    <select
                      value={selectedTemplate.layout}
                      onChange={(e) =>
                        setSelectedTemplate({
                          ...selectedTemplate,
                          layout: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 border border-border rounded bg-background text-sm"
                    >
                      <option value="centered">Centered</option>
                      <option value="sidebar">Sidebar</option>
                      <option value="fullwidth">Full Width</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Heading Font
                    </label>
                    <select
                      value={selectedTemplate.fonts.heading}
                      onChange={(e) =>
                        setSelectedTemplate({
                          ...selectedTemplate,
                          fonts: {
                            ...selectedTemplate.fonts,
                            heading: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-border rounded bg-background text-sm"
                    >
                      {fontOptions.map((font) => (
                        <option key={font} value={font}>
                          {font}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Body Font
                    </label>
                    <select
                      value={selectedTemplate.fonts.body}
                      onChange={(e) =>
                        setSelectedTemplate({
                          ...selectedTemplate,
                          fonts: {
                            ...selectedTemplate.fonts,
                            body: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-border rounded bg-background text-sm"
                    >
                      {fontOptions.map((font) => (
                        <option key={font} value={font}>
                          {font}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </Card>

            {/* Color Editor */}
            <Card className="p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Colors
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {Object.entries(selectedTemplate.colors).map(
                  ([key, value]) => (
                    <div key={key}>
                      <label className="text-sm font-medium mb-2 block capitalize">
                        {key}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={value}
                          onChange={(e) =>
                            handleUpdateColor(
                              key as keyof Template["colors"],
                              e.target.value
                            )
                          }
                          className="w-12 h-10 rounded cursor-pointer border border-border"
                        />
                        <input
                          type="text"
                          value={value}
                          onChange={(e) =>
                            handleUpdateColor(
                              key as keyof Template["colors"],
                              e.target.value
                            )
                          }
                          className="flex-1 px-3 py-2 border border-border rounded bg-background text-sm font-mono"
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            </Card>

            {/* Preview */}
            <Card className="p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </h2>

              <div
                className="p-8 rounded border-2 border-dashed"
                style={{
                  backgroundColor: selectedTemplate.colors.background,
                }}
              >
                <div
                  className="text-4xl font-bold mb-4"
                  style={{
                    color: selectedTemplate.colors.primary,
                    fontFamily: selectedTemplate.fonts.heading,
                  }}
                >
                  Event Title
                </div>

                <div
                  className="text-base mb-6"
                  style={{
                    color: selectedTemplate.colors.secondary,
                    fontFamily: selectedTemplate.fonts.body,
                  }}
                >
                  Join us for an exclusive investor event with live
                  transcription, sentiment analysis, and real-time Q&A.
                </div>

                <button
                  className="px-6 py-3 rounded font-semibold text-white"
                  style={{
                    backgroundColor: selectedTemplate.colors.primary,
                  }}
                >
                  Register Now
                </button>

                <div className="mt-6 flex gap-2">
                  {[
                    selectedTemplate.colors.accent,
                    selectedTemplate.colors.primary,
                    selectedTemplate.colors.secondary,
                  ].map((color, idx) => (
                    <div
                      key={idx}
                      className="flex-1 h-12 rounded"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={() =>
                  handleDuplicateTemplate(selectedTemplate)
                }
                variant="outline"
                className="flex-1 flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Duplicate
              </Button>
              <Button
                onClick={() =>
                  handleDeleteTemplate(selectedTemplate.id)
                }
                variant="destructive"
                className="flex-1 flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
