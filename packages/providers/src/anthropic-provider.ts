import type { ProviderClient, ProviderResponse } from "@code-agent-harness/core";

export class AnthropicProviderStub implements ProviderClient {
  readonly name = "anthropic";

  generate(): Promise<ProviderResponse> {
    // What: Anthropic provider 目前只是边界 stub。Why: v0.x 先稳定 provider-neutral
    // contract，避免在 scope 外实现第二个真实 SDK adapter。How: 明确 reject，
    // 让调用方得到可见失败，而不是误以为 Anthropic 已可用。
    return Promise.reject(
      new Error("Anthropic provider is a v0.1 boundary stub and is not implemented.")
    );
  }
}
