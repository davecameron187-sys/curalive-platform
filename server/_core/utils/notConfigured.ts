export class ServiceNotConfiguredError extends Error {
  public readonly service: string;
  public readonly statusCode: number;

  constructor(service: string, message?: string) {
    super(message ?? `${service} is not configured`);
    this.name = "ServiceNotConfiguredError";
    this.service = service;
    this.statusCode = 503;
  }
}

export function requireConfigured(value: string | undefined, service: string): string {
  if (!value) {
    throw new ServiceNotConfiguredError(service);
  }
  return value;
}
