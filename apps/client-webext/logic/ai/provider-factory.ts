// Provider factory following Single Responsibility Principle
// Each provider type has its own creation logic

import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import type { LLMProviderConfig, ProviderType } from '../storage'

type SupportedProvider =
  | ReturnType<typeof createOpenAI>
  | ReturnType<typeof createAnthropic>
  | ReturnType<typeof createGoogleGenerativeAI>
  | ReturnType<typeof createOpenAICompatible>

/**
 * Interface for provider creation strategy
 * Follows Open/Closed Principle - open for extension, closed for modification
 */
export interface ProviderCreationStrategy {
  canHandle(type: ProviderType): boolean
  create(config: LLMProviderConfig): SupportedProvider | null
}

/**
 * OpenAI provider creation strategy
 */
export class OpenAIProviderStrategy implements ProviderCreationStrategy {
  canHandle(type: ProviderType): boolean {
    return type === 'openai'
  }

  create(config: LLMProviderConfig): SupportedProvider | null {
    if (!config.apiKey) return null

    return createOpenAI({
      apiKey: config.apiKey,
      ...(config.baseURL && { baseURL: config.baseURL }),
    })
  }
}

/**
 * Anthropic provider creation strategy
 */
export class AnthropicProviderStrategy implements ProviderCreationStrategy {
  canHandle(type: ProviderType): boolean {
    return type === 'anthropic'
  }

  create(config: LLMProviderConfig): SupportedProvider | null {
    if (!config.apiKey) return null

    return createAnthropic({
      apiKey: config.apiKey,
    })
  }
}

/**
 * Google Generative AI provider creation strategy
 */
export class GoogleProviderStrategy implements ProviderCreationStrategy {
  canHandle(type: ProviderType): boolean {
    return type === 'google'
  }

  create(config: LLMProviderConfig): SupportedProvider | null {
    if (!config.apiKey) return null

    return createGoogleGenerativeAI({
      apiKey: config.apiKey,
    })
  }
}

/**
 * OpenAI-compatible provider creation strategy
 */
export class OpenAICompatibleProviderStrategy implements ProviderCreationStrategy {
  canHandle(type: ProviderType): boolean {
    return type === 'openai-compatible'
  }

  create(config: LLMProviderConfig): SupportedProvider | null {
    if (!config.apiKey || !config.baseURL) {
      if (config.apiKey && !config.baseURL) {
        console.warn(`OpenAI-compatible provider ${config.id} requires a baseURL`)
      }
      return null
    }

    return createOpenAICompatible({
      name: config.name,
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    })
  }
}

/**
 * Provider factory that delegates to appropriate strategy
 * Follows Strategy Pattern and Dependency Inversion Principle
 */
export class ProviderFactory {
  private strategies: ProviderCreationStrategy[]

  constructor(strategies?: ProviderCreationStrategy[]) {
    // Default strategies for all supported provider types
    this.strategies = strategies || [
      new OpenAIProviderStrategy(),
      new AnthropicProviderStrategy(),
      new GoogleProviderStrategy(),
      new OpenAICompatibleProviderStrategy(),
    ]
  }

  /**
   * Create a provider instance from configuration
   * Returns null if provider cannot be created
   */
  createProvider(config: LLMProviderConfig): SupportedProvider | null {
    const strategy = this.strategies.find((s) => s.canHandle(config.type))

    if (!strategy) {
      console.warn(`No strategy found for provider type: ${config.type}`)
      return null
    }

    return strategy.create(config)
  }

  /**
   * Register a new provider strategy
   * Allows extension without modifying existing code (Open/Closed Principle)
   */
  registerStrategy(strategy: ProviderCreationStrategy): void {
    this.strategies.push(strategy)
  }
}
