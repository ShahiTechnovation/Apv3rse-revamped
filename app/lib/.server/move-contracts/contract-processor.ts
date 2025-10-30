/**
 * Contract Processor
 * Processes, validates, and customizes Move contracts
 */

import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('contract-processor');

export interface ProcessedContract {
  originalContent: string;
  processedContent: string;
  moduleName: string;
  address: string;
  dependencies: string[];
  imports: string[];
  structs: string[];
  functions: string[];
  events: string[];
  errors: Map<string, number>;
  isValid: boolean;
  validationErrors: string[];
}

export interface CustomizationOptions {
  projectName: string;
  moduleName?: string;
  address?: string;
  features?: string[];
  removeFeatures?: string[];
  customConstants?: Record<string, any>;
  additionalImports?: string[];
}

export class ContractProcessor {
  /**
   * Process raw contract content
   */
  processContract(content: string): ProcessedContract {
    const result: ProcessedContract = {
      originalContent: content,
      processedContent: content,
      moduleName: '',
      address: '',
      dependencies: [],
      imports: [],
      structs: [],
      functions: [],
      events: [],
      errors: new Map(),
      isValid: true,
      validationErrors: [],
    };

    try {
      // Extract module name and address
      const moduleMatch = content.match(/module\s+([\w@:]+)::([\w]+)\s*{/);
      if (moduleMatch) {
        result.address = moduleMatch[1];
        result.moduleName = moduleMatch[2];
      } else {
        result.validationErrors.push('No module declaration found');
        result.isValid = false;
      }

      // Extract imports
      const importRegex = /use\s+([\w:]+)(?:::{?([^}]+)}?)?;/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        result.imports.push(importPath);
        
        // Extract dependency from import
        const dep = importPath.split('::')[0];
        if (!result.dependencies.includes(dep)) {
          result.dependencies.push(dep);
        }
      }

      // Extract structs
      const structRegex = /struct\s+(\w+)\s+(?:has\s+[^{]+)?\s*{/g;
      while ((match = structRegex.exec(content)) !== null) {
        result.structs.push(match[1]);
      }

      // Extract functions
      const functionRegex = /(?:public\s+)?(?:entry\s+)?fun\s+(\w+)/g;
      while ((match = functionRegex.exec(content)) !== null) {
        result.functions.push(match[1]);
      }

      // Extract events
      const eventRegex = /#\[event\]\s+struct\s+(\w+)/g;
      while ((match = eventRegex.exec(content)) !== null) {
        result.events.push(match[1]);
      }

      // Extract error constants
      const errorRegex = /const\s+(E\w+):\s*u64\s*=\s*(\d+);/g;
      while ((match = errorRegex.exec(content)) !== null) {
        result.errors.set(match[1], parseInt(match[2]));
      }

      // Validate the contract
      this.validateContract(result);

    } catch (error) {
      logger.error('Error processing contract:', error);
      result.isValid = false;
      result.validationErrors.push(`Processing error: ${error}`);
    }

    return result;
  }

  /**
   * Validate contract structure
   */
  private validateContract(contract: ProcessedContract): void {
    // Check for module declaration
    if (!contract.moduleName) {
      contract.validationErrors.push('Missing module name');
      contract.isValid = false;
    }

    // Check for address
    if (!contract.address) {
      contract.validationErrors.push('Missing module address');
      contract.isValid = false;
    }

    // Check for balanced braces
    const openBraces = (contract.originalContent.match(/{/g) || []).length;
    const closeBraces = (contract.originalContent.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      contract.validationErrors.push(`Unbalanced braces: ${openBraces} open, ${closeBraces} close`);
      contract.isValid = false;
    }

    // Check for at least one function
    if (contract.functions.length === 0) {
      contract.validationErrors.push('No functions found');
      contract.isValid = false;
    }

    // Check for common imports
    const hasStd = contract.imports.some(imp => imp.startsWith('std::'));
    const hasFramework = contract.imports.some(imp => imp.startsWith('aptos_framework::'));
    
    if (!hasStd && !hasFramework) {
      contract.validationErrors.push('Warning: No standard library imports found');
    }

    // Check for duplicate error codes
    const errorCodes = Array.from(contract.errors.values());
    const uniqueCodes = new Set(errorCodes);
    if (errorCodes.length !== uniqueCodes.size) {
      contract.validationErrors.push('Warning: Duplicate error codes found');
    }
  }

  /**
   * Customize contract based on options
   */
  customizeContract(content: string, options: CustomizationOptions): string {
    let customized = content;

    // Update module name
    if (options.moduleName) {
      const safeModuleName = this.sanitizeModuleName(options.moduleName);
      customized = customized.replace(
        /module\s+([\w@:]+)::([\w]+)/,
        `module $1::${safeModuleName}`
      );
    }

    // Update address
    if (options.address) {
      const currentAddress = customized.match(/module\s+([\w@:]+)::/)?.[1];
      if (currentAddress) {
        customized = customized.replace(
          new RegExp(`module\\s+${currentAddress}::`, 'g'),
          `module ${options.address}::`
        );
        // Also update any references to the old address
        customized = customized.replace(
          new RegExp(`@${currentAddress}`, 'g'),
          `@${options.address}`
        );
      }
    }

    // Add custom constants
    if (options.customConstants) {
      const constantsBlock = Object.entries(options.customConstants)
        .map(([name, value]) => {
          if (typeof value === 'number') {
            return `    const ${name}: u64 = ${value};`;
          } else if (typeof value === 'string') {
            return `    const ${name}: vector<u8> = b"${value}";`;
          } else if (typeof value === 'boolean') {
            return `    const ${name}: bool = ${value};`;
          }
          return '';
        })
        .filter(line => line)
        .join('\n');

      // Insert constants after module declaration
      customized = customized.replace(
        /(module\s+[\w@:]+::[\w]+\s*{)/,
        `$1\n${constantsBlock}\n`
      );
    }

    // Add additional imports
    if (options.additionalImports && options.additionalImports.length > 0) {
      const importsBlock = options.additionalImports
        .map(imp => `    use ${imp};`)
        .join('\n');

      // Find the last use statement and add after it
      const lastUseIndex = customized.lastIndexOf('use ');
      if (lastUseIndex !== -1) {
        const endOfLine = customized.indexOf(';', lastUseIndex) + 1;
        customized = customized.slice(0, endOfLine) + '\n' + importsBlock + customized.slice(endOfLine);
      } else {
        // Add after module declaration if no use statements
        customized = customized.replace(
          /(module\s+[\w@:]+::[\w]+\s*{)/,
          `$1\n${importsBlock}\n`
        );
      }
    }

    // Remove features (comment out functions)
    if (options.removeFeatures && options.removeFeatures.length > 0) {
      for (const feature of options.removeFeatures) {
        // Comment out functions matching the feature name
        const functionRegex = new RegExp(
          `((?:public\\s+)?(?:entry\\s+)?fun\\s+${feature}[^}]+})`,
          'gs'
        );
        customized = customized.replace(functionRegex, '/* $1 */');
      }
    }

    return customized;
  }

  /**
   * Sanitize module name
   */
  private sanitizeModuleName(name: string): string {
    // Remove special characters and spaces
    let sanitized = name.replace(/[^a-zA-Z0-9_]/g, '_');
    
    // Ensure it starts with a letter
    if (!/^[a-zA-Z]/.test(sanitized)) {
      sanitized = 'module_' + sanitized;
    }
    
    // Convert to snake_case
    sanitized = sanitized.replace(/([A-Z])/g, '_$1').toLowerCase();
    sanitized = sanitized.replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
    sanitized = sanitized.replace(/_+/g, '_'); // Replace multiple underscores with single
    
    return sanitized;
  }

  /**
   * Generate Move.toml for contract
   */
  generateMoveToml(
    projectName: string,
    dependencies: string[],
    address?: string
  ): string {
    const sanitizedName = this.sanitizeModuleName(projectName);
    const projectAddress = address || sanitizedName;

    const toml = `[package]
name = "${sanitizedName}"
version = "1.0.0"
authors = []

[addresses]
${projectAddress} = "_"

[dependencies]
${dependencies.map(dep => this.getDependencyConfig(dep)).join('\n')}

[dev-dependencies]
`;

    return toml;
  }

  /**
   * Get dependency configuration for Move.toml
   */
  private getDependencyConfig(dependency: string): string {
    const configs: Record<string, string> = {
      'aptos_framework': 'AptosFramework = { git = "https://github.com/aptos-labs/aptos-core.git", subdir = "aptos-move/framework/aptos-framework", rev = "mainnet" }',
      'aptos_std': 'AptosStdlib = { git = "https://github.com/aptos-labs/aptos-core.git", subdir = "aptos-move/framework/aptos-stdlib", rev = "mainnet" }',
      'aptos_token': 'AptosToken = { git = "https://github.com/aptos-labs/aptos-core.git", subdir = "aptos-move/framework/aptos-token", rev = "mainnet" }',
      'aptos_token_objects': 'AptosTokenObjects = { git = "https://github.com/aptos-labs/aptos-core.git", subdir = "aptos-move/framework/aptos-token-objects", rev = "mainnet" }',
      'std': '# std is included by default',
    };

    return configs[dependency] || `# ${dependency} = { git = "...", subdir = "...", rev = "..." }`;
  }

  /**
   * Fix common compilation errors
   */
  fixCompilationErrors(content: string, errors: string[]): string {
    let fixed = content;

    for (const error of errors) {
      // Fix missing semicolons
      if (error.includes('expected `;`')) {
        fixed = fixed.replace(/([^;])\n(\s*})/g, '$1;\n$2');
      }

      // Fix address format
      if (error.includes('invalid address')) {
        fixed = fixed.replace(/@(\w+)/g, '@0x$1');
        fixed = fixed.replace(/@0x0x/g, '@0x'); // Prevent double 0x
      }

      // Fix missing imports
      if (error.includes('unbound module') || error.includes('unbound type')) {
        const moduleMatch = error.match(/module\s+'(\w+)'/);
        if (moduleMatch) {
          const module = moduleMatch[1];
          if (!fixed.includes(`use ${module}`)) {
            // Add import after module declaration
            fixed = fixed.replace(
              /(module\s+[\w@:]+::[\w]+\s*{)/,
              `$1\n    use ${this.guessImportPath(module)};`
            );
          }
        }
      }

      // Fix visibility issues
      if (error.includes('not visible')) {
        // Make functions public
        fixed = fixed.replace(/(\s+)fun\s+/g, '$1public fun ');
      }
    }

    return fixed;
  }

  /**
   * Guess import path for a module
   */
  private guessImportPath(module: string): string {
    const commonImports: Record<string, string> = {
      'signer': 'aptos_framework::signer',
      'account': 'aptos_framework::account',
      'coin': 'aptos_framework::coin',
      'event': 'aptos_framework::event',
      'timestamp': 'aptos_framework::timestamp',
      'string': 'std::string',
      'vector': 'std::vector',
      'option': 'std::option',
      'token': 'aptos_token::token',
      'collection': 'aptos_token::collection',
      'fungible_asset': 'aptos_framework::fungible_asset',
      'object': 'aptos_framework::object',
    };

    return commonImports[module.toLowerCase()] || `aptos_framework::${module}`;
  }

  /**
   * Merge multiple contracts
   */
  mergeContracts(contracts: string[], mainModuleName: string): string {
    const processedContracts = contracts.map(c => this.processContract(c));
    
    // Collect all unique imports
    const allImports = new Set<string>();
    processedContracts.forEach(pc => {
      pc.imports.forEach(imp => allImports.add(imp));
    });

    // Collect all structs, functions, events
    const allStructs: string[] = [];
    const allFunctions: string[] = [];
    const allEvents: string[] = [];
    const allErrors = new Map<string, number>();

    for (const pc of processedContracts) {
      // Extract actual struct definitions
      const structMatches = pc.originalContent.matchAll(
        /struct\s+\w+[^{]*{[^}]+}/gs
      );
      for (const match of structMatches) {
        allStructs.push(match[0]);
      }

      // Extract function definitions
      const funcMatches = pc.originalContent.matchAll(
        /(?:public\s+)?(?:entry\s+)?fun\s+\w+[^{]*{[^}]+}/gs
      );
      for (const match of funcMatches) {
        allFunctions.push(match[0]);
      }

      // Merge error codes
      pc.errors.forEach((code, name) => {
        if (!allErrors.has(name)) {
          allErrors.set(name, code);
        }
      });
    }

    // Build merged contract
    const merged = `module merged::${this.sanitizeModuleName(mainModuleName)} {
${Array.from(allImports).map(imp => `    use ${imp};`).join('\n')}

    // Error codes
${Array.from(allErrors.entries()).map(([name, code]) => `    const ${name}: u64 = ${code};`).join('\n')}

    // Structs
${allStructs.map(s => '    ' + s.replace(/\n/g, '\n    ')).join('\n\n')}

    // Functions
${allFunctions.map(f => '    ' + f.replace(/\n/g, '\n    ')).join('\n\n')}
}`;

    return merged;
  }
}

// Singleton instance
let instance: ContractProcessor | null = null;

export function getContractProcessor(): ContractProcessor {
  if (!instance) {
    instance = new ContractProcessor();
  }
  return instance;
}
