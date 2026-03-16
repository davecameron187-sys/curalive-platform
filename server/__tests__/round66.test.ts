/**
 * Round 66 Comprehensive Tests
 * Webhook Configuration, Alert Templates, Audit Logging
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  AlertTemplateEngine,
  AlertTemplate,
} from "@/server/services/alertTemplateEngine";

describe("Round 66 Configuration & Compliance Features", () => {
  describe("Alert Template Engine", () => {
    let templateEngine: AlertTemplateEngine;

    beforeEach(() => {
      templateEngine = new AlertTemplateEngine();
    });

    it("should create a new template", () => {
      const template = templateEngine.createTemplate({
        name: "Test Template",
        alertType: "escalation",
        integrationType: "email",
        subject: "Alert: {{title}}",
        body: "Severity: {{severity}}\nDescription: {{description}}",
        variables: ["title", "severity", "description"],
        enabled: true,
      });

      expect(template.id).toBeDefined();
      expect(template.name).toBe("Test Template");
      expect(template.enabled).toBe(true);
    });

    it("should update an existing template", () => {
      const template = templateEngine.createTemplate({
        name: "Original Name",
        alertType: "escalation",
        integrationType: "email",
        subject: "Original Subject",
        body: "Original Body",
        variables: [],
        enabled: true,
      });

      const updated = templateEngine.updateTemplate(template.id, {
        name: "Updated Name",
        subject: "Updated Subject",
      });

      expect(updated?.name).toBe("Updated Name");
      expect(updated?.subject).toBe("Updated Subject");
    });

    it("should delete a template", () => {
      const template = templateEngine.createTemplate({
        name: "To Delete",
        alertType: "escalation",
        integrationType: "email",
        subject: "Subject",
        body: "Body",
        variables: [],
        enabled: true,
      });

      const deleted = templateEngine.deleteTemplate(template.id);
      expect(deleted).toBe(true);

      const retrieved = templateEngine.getTemplate(template.id);
      expect(retrieved).toBeNull();
    });

    it("should retrieve template by ID", () => {
      const template = templateEngine.createTemplate({
        name: "Retrieve Test",
        alertType: "escalation",
        integrationType: "email",
        subject: "Subject",
        body: "Body",
        variables: [],
        enabled: true,
      });

      const retrieved = templateEngine.getTemplate(template.id);
      expect(retrieved?.name).toBe("Retrieve Test");
    });

    it("should get all templates", () => {
      templateEngine.createTemplate({
        name: "Template 1",
        alertType: "escalation",
        integrationType: "email",
        subject: "Subject 1",
        body: "Body 1",
        variables: [],
        enabled: true,
      });

      templateEngine.createTemplate({
        name: "Template 2",
        alertType: "correlation",
        integrationType: "pagerduty",
        subject: "Subject 2",
        body: "Body 2",
        variables: [],
        enabled: true,
      });

      const all = templateEngine.getAllTemplates();
      expect(all).toHaveLength(2);
    });

    it("should filter templates by alert type", () => {
      templateEngine.createTemplate({
        name: "Escalation Template",
        alertType: "escalation",
        integrationType: "email",
        subject: "Subject",
        body: "Body",
        variables: [],
        enabled: true,
      });

      templateEngine.createTemplate({
        name: "Correlation Template",
        alertType: "correlation",
        integrationType: "email",
        subject: "Subject",
        body: "Body",
        variables: [],
        enabled: true,
      });

      const escalations = templateEngine.getTemplatesByAlertType("escalation");
      expect(escalations).toHaveLength(1);
      expect(escalations[0].name).toBe("Escalation Template");
    });

    it("should filter templates by integration type", () => {
      templateEngine.createTemplate({
        name: "Email Template",
        alertType: "escalation",
        integrationType: "email",
        subject: "Subject",
        body: "Body",
        variables: [],
        enabled: true,
      });

      templateEngine.createTemplate({
        name: "PagerDuty Template",
        alertType: "escalation",
        integrationType: "pagerduty",
        subject: "Subject",
        body: "Body",
        variables: [],
        enabled: true,
      });

      const emails = templateEngine.getTemplatesByIntegrationType("email");
      expect(emails).toHaveLength(1);
      expect(emails[0].name).toBe("Email Template");
    });

    it("should render template with context variables", () => {
      const template = templateEngine.createTemplate({
        name: "Render Test",
        alertType: "escalation",
        integrationType: "email",
        subject: "Alert: {{title}}",
        body: "Severity: {{severity}}\nDescription: {{description}}",
        variables: ["title", "severity", "description"],
        enabled: true,
      });

      const rendered = templateEngine.renderTemplate(template.id, {
        title: "High Latency",
        severity: "critical",
        description: "Kiosk latency exceeded threshold",
      });

      expect(rendered?.subject).toBe("Alert: High Latency");
      expect(rendered?.body).toContain("Severity: critical");
      expect(rendered?.body).toContain(
        "Description: Kiosk latency exceeded threshold"
      );
    });

    it("should validate template syntax", () => {
      const validTemplate = "Alert: {{title}} - {{severity}}";
      const validation = templateEngine.validateTemplate(validTemplate);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should detect mismatched braces", () => {
      const invalidTemplate = "Alert: {{title} - {{severity}}";
      const validation = templateEngine.validateTemplate(invalidTemplate);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it("should detect undefined variables", () => {
      const invalidTemplate = "Alert: {{title}} - {{unknownVar}}";
      const validation = templateEngine.validateTemplate(invalidTemplate);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some((e) => e.includes("unknownVar"))).toBe(
        true
      );
    });

    it("should get available variables", () => {
      const variables = templateEngine.getAvailableVariables();

      expect(variables.length).toBeGreaterThan(0);
      expect(variables.some((v) => v.name === "title")).toBe(true);
      expect(variables.some((v) => v.name === "severity")).toBe(true);
    });

    it("should get variable by name", () => {
      const variable = templateEngine.getVariable("severity");

      expect(variable).not.toBeNull();
      expect(variable?.name).toBe("severity");
      expect(variable?.description).toBeDefined();
    });

    it("should generate default templates", () => {
      const defaults = templateEngine.generateDefaultTemplates();

      expect(defaults.length).toBeGreaterThan(0);
      expect(defaults.some((t) => t.integrationType === "pagerduty")).toBe(
        true
      );
      expect(defaults.some((t) => t.integrationType === "opsgenie")).toBe(true);
    });

    it("should clone a template", () => {
      const original = templateEngine.createTemplate({
        name: "Original",
        alertType: "escalation",
        integrationType: "email",
        subject: "Subject",
        body: "Body",
        variables: [],
        enabled: true,
      });

      const cloned = templateEngine.cloneTemplate(original.id, "Cloned Copy");

      expect(cloned?.name).toBe("Cloned Copy");
      expect(cloned?.alertType).toBe(original.alertType);
      expect(cloned?.body).toBe(original.body);
      expect(cloned?.id).not.toBe(original.id);
    });

    it("should export template as JSON", () => {
      const template = templateEngine.createTemplate({
        name: "Export Test",
        alertType: "escalation",
        integrationType: "email",
        subject: "Subject",
        body: "Body",
        variables: [],
        enabled: true,
      });

      const json = templateEngine.exportTemplate(template.id);

      expect(json).not.toBeNull();
      expect(json).toContain("Export Test");
    });

    it("should import template from JSON", () => {
      const json = JSON.stringify({
        name: "Imported Template",
        alertType: "escalation",
        integrationType: "email",
        subject: "Subject",
        body: "Body",
        variables: [],
        enabled: true,
      });

      const imported = templateEngine.importTemplate(json);

      expect(imported?.name).toBe("Imported Template");
      expect(imported?.id).toBeDefined();
    });

    it("should get template statistics", () => {
      templateEngine.createTemplate({
        name: "Template 1",
        alertType: "escalation",
        integrationType: "email",
        subject: "Subject",
        body: "Body",
        variables: [],
        enabled: true,
      });

      templateEngine.createTemplate({
        name: "Template 2",
        alertType: "correlation",
        integrationType: "pagerduty",
        subject: "Subject",
        body: "Body",
        variables: [],
        enabled: true,
      });

      const stats = templateEngine.getStatistics();

      expect(stats.totalTemplates).toBe(2);
      expect(stats.enabledCount).toBe(2);
      expect(stats.byAlertType["escalation"]).toBe(1);
      expect(stats.byAlertType["correlation"]).toBe(1);
    });

    it("should handle complex template rendering", () => {
      const template = templateEngine.createTemplate({
        name: "Complex Template",
        alertType: "correlation",
        integrationType: "custom",
        body: 'Event: {{eventId}}, Kiosks: {{affectedCount}}, Confidence: {{confidence}}%, URL: {{actionUrl}}',
        variables: ["eventId", "affectedCount", "confidence", "actionUrl"],
        enabled: true,
      });

      const rendered = templateEngine.renderTemplate(template.id, {
        eventId: "event-2026-03-16",
        affectedCount: 5,
        confidence: 87,
        actionUrl: "https://app.example.com/alerts",
      });

      expect(rendered?.body).toContain("event-2026-03-16");
      expect(rendered?.body).toContain("5");
      expect(rendered?.body).toContain("87");
    });
  });

  describe("Integration Tests", () => {
    it("should handle template lifecycle", () => {
      const engine = new AlertTemplateEngine();

      // Create
      const template = engine.createTemplate({
        name: "Lifecycle Test",
        alertType: "escalation",
        integrationType: "email",
        subject: "Alert: {{title}}",
        body: "{{description}}",
        variables: ["title", "description"],
        enabled: true,
      });

      expect(template.id).toBeDefined();

      // Retrieve
      const retrieved = engine.getTemplate(template.id);
      expect(retrieved?.name).toBe("Lifecycle Test");

      // Update
      const updated = engine.updateTemplate(template.id, {
        name: "Updated Lifecycle Test",
      });
      expect(updated?.name).toBe("Updated Lifecycle Test");

      // Delete
      const deleted = engine.deleteTemplate(template.id);
      expect(deleted).toBe(true);

      const notFound = engine.getTemplate(template.id);
      expect(notFound).toBeNull();
    });

    it("should manage multiple templates with filtering", () => {
      const engine = new AlertTemplateEngine();

      // Create multiple templates
      const templates = [
        {
          name: "Email Escalation",
          alertType: "escalation" as const,
          integrationType: "email" as const,
        },
        {
          name: "PagerDuty Escalation",
          alertType: "escalation" as const,
          integrationType: "pagerduty" as const,
        },
        {
          name: "Email Correlation",
          alertType: "correlation" as const,
          integrationType: "email" as const,
        },
      ];

      templates.forEach((t) => {
        engine.createTemplate({
          ...t,
          subject: "Subject",
          body: "Body",
          variables: [],
          enabled: true,
        });
      });

      // Filter by alert type
      const escalations = engine.getTemplatesByAlertType("escalation");
      expect(escalations).toHaveLength(2);

      // Filter by integration type
      const emails = engine.getTemplatesByIntegrationType("email");
      expect(emails).toHaveLength(2);

      // Get all
      const all = engine.getAllTemplates();
      expect(all).toHaveLength(3);
    });
  });
});
