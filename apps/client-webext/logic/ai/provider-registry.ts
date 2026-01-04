import { createProviderRegistry } from "ai";
import type { LLMProviderConfig } from "../storage";
import { ProviderFactory } from "./provider-factory";

/**
 * Create a provider registry with custom provider support
 * Uses ProviderFactory to delegate provider creation (Strategy Pattern)
 * Follows Single Responsibility Principle - only handles registry creation
 */
export function createLLMProviderRegistry(providers: LLMProviderConfig[]) {
  const factory = new ProviderFactory();
  const providerMap: Record<string, any> = {};

  // Register each provider using factory
  providers.forEach((config) => {
    const provider = factory.createProvider(config);
    if (provider) {
      providerMap[config.id] = provider;
    }
  });

  return createProviderRegistry(providerMap);
}

export function parseModelString(
  modelString: string,
  providers?: LLMProviderConfig[],
) {
  if (providers && providers.length > 0) {
    const registry = createLLMProviderRegistry(providers);
    return registry.languageModel(modelString as `${string}:${string}`);
  } else {
    return modelString;
  }
}
