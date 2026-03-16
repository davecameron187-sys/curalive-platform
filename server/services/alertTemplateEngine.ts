/**
 * Alert Notification Template Engine
 * Manages customizable message templates for different alert types and integrations
 */

export interface AlertTemplate {
  id: number;
  name: string;
  alertType: "escalation" | "correlation" | "prediction" | "resolution";
  integrationType: "pagerduty" | "opsgenie" | "email" | "sms" | "custom";
  subject?: string;
  body: string;
  variables: string[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariable {
  name: string;
  description: string;
  example: string;
}

export interface TemplateContext {
  [key: string]: string | number | boolean | Date;
}

export class AlertTemplateEngine {
  private templates: Map<number, AlertTemplate> = new Map();
  private templateCounter = 0;

  // Available variables for templates
  private readonly availableVariables: Record<string, TemplateVariable> = {
    alertId: {
      name: "alertId",
      description: "Unique identifier for the alert",
      example: "alert-12345",
    },
    alertType: {
      name: "alertType",
      description: "Type of alert (escalation, correlation, prediction)",
      example: "escalation",
    },
    severity: {
      name: "severity",
      description: "Alert severity level",
      example: "critical",
    },
    title: {
      name: "title",
      description: "Alert title",
      example: "High Latency Detected",
    },
    description: {
      name: "description",
      description: "Detailed alert description",
      example: "Kiosk latency exceeded 500ms threshold",
    },
    kioskId: {
      name: "kioskId",
      description: "Affected kiosk identifier",
      example: "kiosk-venue-1-01",
    },
    eventId: {
      name: "eventId",
      description: "Associated event identifier",
      example: "event-2026-03-16",
    },
    timestamp: {
      name: "timestamp",
      description: "Alert timestamp",
      example: "2026-03-16T14:30:00Z",
    },
    affectedCount: {
      name: "affectedCount",
      description: "Number of affected kiosks (for correlations)",
      example: "5",
    },
    confidence: {
      name: "confidence",
      description: "Confidence level for predictions",
      example: "0.87",
    },
    actionUrl: {
      name: "actionUrl",
      description: "URL to take action on the alert",
      example: "https://app.example.com/alerts/alert-12345",
    },
    dashboardUrl: {
      name: "dashboardUrl",
      description: "URL to analytics dashboard",
      example: "https://app.example.com/analytics",
    },
  };

  /**
   * Create a new template
   */
  createTemplate(template: Omit<AlertTemplate, "id" | "createdAt" | "updatedAt">): AlertTemplate {
    const id = ++this.templateCounter;
    const newTemplate: AlertTemplate = {
      ...template,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.templates.set(id, newTemplate);
    return newTemplate;
  }

  /**
   * Update an existing template
   */
  updateTemplate(id: number, updates: Partial<AlertTemplate>): AlertTemplate | null {
    const template = this.templates.get(id);
    if (!template) return null;

    const updated: AlertTemplate = {
      ...template,
      ...updates,
      id: template.id,
      createdAt: template.createdAt,
      updatedAt: new Date(),
    };
    this.templates.set(id, updated);
    return updated;
  }

  /**
   * Delete a template
   */
  deleteTemplate(id: number): boolean {
    return this.templates.delete(id);
  }

  /**
   * Get a template by ID
   */
  getTemplate(id: number): AlertTemplate | null {
    return this.templates.get(id) || null;
  }

  /**
   * Get all templates
   */
  getAllTemplates(): AlertTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by alert type
   */
  getTemplatesByAlertType(alertType: AlertTemplate["alertType"]): AlertTemplate[] {
    return Array.from(this.templates.values()).filter(
      (t) => t.alertType === alertType
    );
  }

  /**
   * Get templates by integration type
   */
  getTemplatesByIntegrationType(
    integrationType: AlertTemplate["integrationType"]
  ): AlertTemplate[] {
    return Array.from(this.templates.values()).filter(
      (t) => t.integrationType === integrationType
    );
  }

  /**
   * Render template with context variables
   */
  renderTemplate(templateId: number, context: TemplateContext): { subject?: string; body: string } | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    const subject = template.subject
      ? this.substituteVariables(template.subject, context)
      : undefined;
    const body = this.substituteVariables(template.body, context);

    return { subject, body };
  }

  /**
   * Substitute variables in template string
   */
  private substituteVariables(template: string, context: TemplateContext): string {
    let result = template;

    // Replace {{variable}} patterns
    const variablePattern = /\{\{(\w+)\}\}/g;
    result = result.replace(variablePattern, (match, variable) => {
      if (variable in context) {
        const value = context[variable];
        return String(value);
      }
      return match; // Keep original if variable not found
    });

    return result;
  }

  /**
   * Validate template syntax
   */
  validateTemplate(template: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for unclosed braces
    const openBraces = (template.match(/\{\{/g) || []).length;
    const closeBraces = (template.match(/\}\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push("Mismatched braces in template");
    }

    // Check for undefined variables
    const variablePattern = /\{\{(\w+)\}\}/g;
    let match;
    while ((match = variablePattern.exec(template)) !== null) {
      const variable = match[1];
      if (!(variable in this.availableVariables)) {
        errors.push(`Unknown variable: {{${variable}}}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get available variables
   */
  getAvailableVariables(): TemplateVariable[] {
    return Object.values(this.availableVariables);
  }

  /**
   * Get variable by name
   */
  getVariable(name: string): TemplateVariable | null {
    return this.availableVariables[name] || null;
  }

  /**
   * Generate default templates for each integration type
   */
  generateDefaultTemplates(): AlertTemplate[] {
    const defaults: Omit<AlertTemplate, "id" | "createdAt" | "updatedAt">[] = [
      {
        name: "PagerDuty Escalation",
        alertType: "escalation",
        integrationType: "pagerduty",
        subject: "Alert: {{title}}",
        body: "Severity: {{severity}}\nKiosk: {{kioskId}}\nEvent: {{eventId}}\nTime: {{timestamp}}",
        variables: ["title", "severity", "kioskId", "eventId", "timestamp"],
        enabled: true,
      },
      {
        name: "Opsgenie Correlation",
        alertType: "correlation",
        integrationType: "opsgenie",
        subject: "Systemic Issue: {{title}}",
        body: "{{affectedCount}} kiosks affected\nDescription: {{description}}\nDashboard: {{dashboardUrl}}",
        variables: ["title", "affectedCount", "description", "dashboardUrl"],
        enabled: true,
      },
      {
        name: "Email Prediction",
        alertType: "prediction",
        integrationType: "email",
        subject: "Maintenance Predicted: {{title}}",
        body: "A maintenance issue has been predicted with {{confidence}} confidence.\n\nDetails: {{description}}\n\nAction: {{actionUrl}}",
        variables: ["title", "confidence", "description", "actionUrl"],
        enabled: true,
      },
      {
        name: "SMS Alert",
        alertType: "escalation",
        integrationType: "sms",
        body: "{{title}} - {{severity}} - {{kioskId}} - {{timestamp}}",
        variables: ["title", "severity", "kioskId", "timestamp"],
        enabled: true,
      },
      {
        name: "Custom Webhook",
        alertType: "escalation",
        integrationType: "custom",
        body: '{"alert_id":"{{alertId}}","type":"{{alertType}}","severity":"{{severity}}","title":"{{title}}","description":"{{description}}","timestamp":"{{timestamp}}"}',
        variables: ["alertId", "alertType", "severity", "title", "description", "timestamp"],
        enabled: true,
      },
    ];

    return defaults.map((template) => this.createTemplate(template));
  }

  /**
   * Clone a template
   */
  cloneTemplate(id: number, newName: string): AlertTemplate | null {
    const template = this.templates.get(id);
    if (!template) return null;

    return this.createTemplate({
      name: newName,
      alertType: template.alertType,
      integrationType: template.integrationType,
      subject: template.subject,
      body: template.body,
      variables: [...template.variables],
      enabled: true,
    });
  }

  /**
   * Export template as JSON
   */
  exportTemplate(id: number): string | null {
    const template = this.templates.get(id);
    if (!template) return null;

    return JSON.stringify(template, null, 2);
  }

  /**
   * Import template from JSON
   */
  importTemplate(json: string): AlertTemplate | null {
    try {
      const data = JSON.parse(json);
      const { id, createdAt, updatedAt, ...templateData } = data;
      return this.createTemplate(templateData);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get template statistics
   */
  getStatistics(): {
    totalTemplates: number;
    byAlertType: Record<string, number>;
    byIntegrationType: Record<string, number>;
    enabledCount: number;
  } {
    const templates = Array.from(this.templates.values());
    const stats = {
      totalTemplates: templates.length,
      byAlertType: {} as Record<string, number>,
      byIntegrationType: {} as Record<string, number>,
      enabledCount: templates.filter((t) => t.enabled).length,
    };

    templates.forEach((template) => {
      stats.byAlertType[template.alertType] =
        (stats.byAlertType[template.alertType] || 0) + 1;
      stats.byIntegrationType[template.integrationType] =
        (stats.byIntegrationType[template.integrationType] || 0) + 1;
    });

    return stats;
  }
}

// Singleton instance
let instance: AlertTemplateEngine | null = null;

export function getTemplateEngine(): AlertTemplateEngine {
  if (!instance) {
    instance = new AlertTemplateEngine();
  }
  return instance;
}
