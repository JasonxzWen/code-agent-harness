import type { ProviderClient, ProviderResponse } from "@code-agent-harness/core";

export class AnthropicProviderStub implements ProviderClient {
  readonly name = "anthropic";

  generate(): Promise<ProviderResponse> {
    return Promise.reject(
      new Error("Anthropic provider is a v0.1 boundary stub and is not implemented.")
    );
  }
}
