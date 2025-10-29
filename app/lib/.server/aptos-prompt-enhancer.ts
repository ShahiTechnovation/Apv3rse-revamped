/**
 * Aptos Prompt Enhancer
 * Combines user prompts with relevant Aptos documentation context
 * Optimizes prompts for better AI-generated Move code
 */

import { getAptosContextService } from './aptos-context-service';

interface EnhancedPrompt {
  systemPrompt: string;
  userPrompt: string;
  hasContext: boolean;
  contextSource: 'full' | 'small' | 'none';
}

class AptosPromptEnhancer {
  private contextService: Awaited<ReturnType<typeof getAptosContextService>> | null = null;

  /**
   * Initialize the enhancer
   */
  async initialize(): Promise<void> {
    if (!this.contextService) {
      this.contextService = await getAptosContextService();
    }
  }

  /**
   * Enhance a user prompt with Aptos context
   */
  async enhancePrompt(userPrompt: string, isAptosMode: boolean = false): Promise<EnhancedPrompt> {
    await this.initialize();

    // Check if this is an Aptos-related query
    const isAptosQuery = isAptosMode || this.contextService!.isAptosQuery(userPrompt);

    if (!isAptosQuery) {
      return {
        systemPrompt: '',
        userPrompt,
        hasContext: false,
        contextSource: 'none',
      };
    }

    // Get relevant context from llms.txt
    const context = await this.contextService!.getRelevantContext(userPrompt);

    // Build enhanced system prompt
    const systemPrompt = this.buildSystemPrompt(context);

    return {
      systemPrompt,
      userPrompt,
      hasContext: context.length > 0,
      contextSource: context.includes('llms-full') ? 'full' : 'small',
    };
  }

  /**
   * Build system prompt with context
   */
  private buildSystemPrompt(context: string): string {
    if (!context) {
      return this.getBaseAptosSystemPrompt();
    }

    return `${this.getBaseAptosSystemPrompt()}

## Aptos Documentation Reference

Use the following official Aptos documentation as reference when generating code or answering questions:

${context}

---

**Important Guidelines:**
- Always follow the patterns and best practices shown in the documentation above
- Use the exact syntax and conventions from the Aptos documentation
- Reference specific sections when explaining concepts
- Ensure generated Move code follows Aptos security guidelines
- Use proper error handling and validation as shown in examples
`;
  }

  /**
   * Get base system prompt for Aptos development
   */
  private getBaseAptosSystemPrompt(): string {
    return `You are an expert Aptos blockchain developer specializing in Move smart contracts.

**Your Expertise:**
- Move programming language and its unique features (resources, abilities, generics)
- Aptos blockchain architecture and transaction lifecycle
- Smart contract development, testing, and deployment
- Aptos SDK usage (TypeScript, Python, Rust, Go)
- Digital assets (NFTs, Fungible Assets, Coins)
- Security best practices and common vulnerabilities
- Gas optimization and performance tuning

**Code Generation Standards:**
- Write clean, well-documented Move code
- Include proper error handling with descriptive error codes
- Follow Aptos naming conventions and style guide
- Add inline comments explaining complex logic
- Use appropriate abilities (copy, drop, store, key) for structs
- Implement proper access control with signers
- Consider gas costs in implementation decisions

**When Generating Move Code:**
1. Start with module declaration and imports
2. Define clear struct types with appropriate abilities
3. Implement entry functions for user interactions
4. Add view functions for read-only operations
5. Include comprehensive error handling
6. Add unit tests when appropriate
7. Document public APIs

**Security Considerations:**
- Validate all inputs and check preconditions
- Prevent integer overflow/underflow
- Implement proper access control
- Avoid reentrancy vulnerabilities
- Use resource-oriented programming patterns
- Follow the principle of least privilege`;
  }

  /**
   * Create a prompt for Move code generation
   */
  async createMoveCodePrompt(
    description: string,
    requirements: string[] = [],
    examples: string[] = []
  ): Promise<EnhancedPrompt> {
    const userPrompt = this.buildMoveCodeUserPrompt(description, requirements, examples);
    return await this.enhancePrompt(userPrompt, true);
  }

  /**
   * Build user prompt for Move code generation
   */
  private buildMoveCodeUserPrompt(
    description: string,
    requirements: string[],
    examples: string[]
  ): string {
    let prompt = `Generate a Move smart contract with the following specifications:

**Description:**
${description}`;

    if (requirements.length > 0) {
      prompt += `

**Requirements:**
${requirements.map((req, i) => `${i + 1}. ${req}`).join('\n')}`;
    }

    if (examples.length > 0) {
      prompt += `

**Examples/References:**
${examples.map((ex, i) => `${i + 1}. ${ex}`).join('\n')}`;
    }

    prompt += `

Please provide:
1. Complete Move module code
2. Explanation of key components
3. Usage examples
4. Any important security considerations`;

    return prompt;
  }

  /**
   * Create a prompt for debugging Move code
   */
  async createDebugPrompt(code: string, error: string): Promise<EnhancedPrompt> {
    const userPrompt = `I'm getting the following error in my Move code:

**Error:**
\`\`\`
${error}
\`\`\`

**Code:**
\`\`\`move
${code}
\`\`\`

Please help me:
1. Identify the root cause of the error
2. Explain why it's happening
3. Provide a corrected version of the code
4. Suggest best practices to avoid similar issues`;

    return await this.enhancePrompt(userPrompt, true);
  }

  /**
   * Create a prompt for optimizing Move code
   */
  async createOptimizationPrompt(code: string, goals: string[] = []): Promise<EnhancedPrompt> {
    const userPrompt = `Please optimize the following Move code:

**Code:**
\`\`\`move
${code}
\`\`\`

${goals.length > 0 ? `**Optimization Goals:**\n${goals.map((g, i) => `${i + 1}. ${g}`).join('\n')}` : ''}

Please provide:
1. Optimized version of the code
2. Explanation of changes made
3. Expected performance improvements
4. Any trade-offs or considerations`;

    return await this.enhancePrompt(userPrompt, true);
  }

  /**
   * Create a prompt for explaining Move concepts
   */
  async createExplanationPrompt(concept: string, level: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'): Promise<EnhancedPrompt> {
    const userPrompt = `Explain the following Aptos/Move concept at a ${level} level:

**Concept:** ${concept}

Please include:
1. Clear definition and purpose
2. How it works in the Aptos ecosystem
3. Code examples demonstrating usage
4. Common use cases
5. Best practices and gotchas`;

    return await this.enhancePrompt(userPrompt, true);
  }
}

// Singleton instance
let aptosPromptEnhancer: AptosPromptEnhancer | null = null;

/**
 * Get or create the Aptos Prompt Enhancer instance
 */
export async function getAptosPromptEnhancer(): Promise<AptosPromptEnhancer> {
  if (!aptosPromptEnhancer) {
    aptosPromptEnhancer = new AptosPromptEnhancer();
    await aptosPromptEnhancer.initialize();
  }
  return aptosPromptEnhancer;
}

export { AptosPromptEnhancer };
export type { EnhancedPrompt };
