#!/usr/bin/env node

/**
 * Pre-Deployment Checklist for Vercel
 * Run this before deploying to catch common issues
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const REQUIRED_FILES = [
  'package.json',
  'vercel.json',
  'server.ts',
  'vite.config.ts',
  'tsconfig.json',
];

const REQUIRED_SCRIPTS = [
  'build',
  'vercel-build',
  'deploy',
];

const CLOUDFLARE_FILES = [
  'functions/[[path]].ts',
  'wrangler.toml',
  'load-context.ts',
];

const WARNINGS = [];
const ERRORS = [];
const SUCCESS = [];

console.log('🚀 Pre-Deployment Checklist for Vercel\n');

// Check required files exist
console.log('📁 Checking required files...');
REQUIRED_FILES.forEach(file => {
  if (existsSync(resolve(file))) {
    SUCCESS.push(`✓ ${file} exists`);
  } else {
    ERRORS.push(`✗ ${file} is missing`);
  }
});

// Check package.json scripts
console.log('\n📜 Checking package.json scripts...');
try {
  const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
  
  REQUIRED_SCRIPTS.forEach(script => {
    if (pkg.scripts && pkg.scripts[script]) {
      SUCCESS.push(`✓ Script "${script}" exists`);
    } else {
      ERRORS.push(`✗ Script "${script}" is missing`);
    }
  });

  // Check for Vercel adapter
  if (pkg.dependencies && pkg.dependencies['@remix-run/vercel']) {
    SUCCESS.push('✓ @remix-run/vercel adapter installed');
  } else {
    ERRORS.push('✗ @remix-run/vercel adapter not found in dependencies');
  }

} catch (error) {
  ERRORS.push(`✗ Failed to read package.json: ${error.message}`);
}

// Check for Cloudflare files that should be ignored
console.log('\n🔍 Checking for Cloudflare-specific files...');
CLOUDFLARE_FILES.forEach(file => {
  if (existsSync(resolve(file))) {
    WARNINGS.push(`⚠ ${file} exists (should be in .vercelignore)`);
  } else {
    SUCCESS.push(`✓ ${file} properly excluded`);
  }
});

// Check .vercelignore
console.log('\n📋 Checking .vercelignore...');
if (existsSync('.vercelignore')) {
  const ignoreContent = readFileSync('.vercelignore', 'utf-8');
  
  const shouldIgnore = [
    'functions',
    'wrangler.toml',
    'load-context.ts',
    'Dockerfile',
    'docker-compose.yaml',
  ];

  shouldIgnore.forEach(item => {
    if (ignoreContent.includes(item)) {
      SUCCESS.push(`✓ ${item} is ignored`);
    } else {
      WARNINGS.push(`⚠ ${item} should be in .vercelignore`);
    }
  });
} else {
  ERRORS.push('✗ .vercelignore file not found');
}

// Check tsconfig.json
console.log('\n⚙️ Checking tsconfig.json...');
try {
  const tsconfig = JSON.parse(readFileSync('tsconfig.json', 'utf-8'));
  
  if (tsconfig.compilerOptions.types.includes('@remix-run/node')) {
    SUCCESS.push('✓ Using @remix-run/node types');
  } else if (tsconfig.compilerOptions.types.includes('@remix-run/cloudflare')) {
    ERRORS.push('✗ Using @remix-run/cloudflare types (should use @remix-run/node)');
  }
} catch (error) {
  WARNINGS.push(`⚠ Failed to parse tsconfig.json: ${error.message}`);
}

// Check vercel.json
console.log('\n🔧 Checking vercel.json...');
try {
  const vercelConfig = JSON.parse(readFileSync('vercel.json', 'utf-8'));
  
  if (vercelConfig.buildCommand) {
    SUCCESS.push('✓ Build command configured');
  } else {
    WARNINGS.push('⚠ No build command specified');
  }

  if (vercelConfig.outputDirectory) {
    SUCCESS.push(`✓ Output directory: ${vercelConfig.outputDirectory}`);
  } else {
    ERRORS.push('✗ No output directory specified');
  }

  if (vercelConfig.functions) {
    SUCCESS.push('✓ Serverless functions configured');
  }

  if (vercelConfig.headers && vercelConfig.headers.length > 0) {
    SUCCESS.push('✓ Security headers configured');
  }
} catch (error) {
  ERRORS.push(`✗ Failed to read vercel.json: ${error.message}`);
}

// Print results
console.log('\n' + '='.repeat(60));
console.log('\n✅ SUCCESS:');
SUCCESS.forEach(msg => console.log(`  ${msg}`));

if (WARNINGS.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  WARNINGS.forEach(msg => console.log(`  ${msg}`));
}

if (ERRORS.length > 0) {
  console.log('\n❌ ERRORS:');
  ERRORS.forEach(msg => console.log(`  ${msg}`));
}

console.log('\n' + '='.repeat(60));

// Summary
const total = SUCCESS.length + WARNINGS.length + ERRORS.length;
console.log(`\n📊 Summary: ${SUCCESS.length}/${total} checks passed`);

if (ERRORS.length > 0) {
  console.log('\n❌ Deployment NOT recommended. Please fix errors first.\n');
  process.exit(1);
} else if (WARNINGS.length > 0) {
  console.log('\n⚠️  Deployment possible but warnings should be reviewed.\n');
  process.exit(0);
} else {
  console.log('\n✅ All checks passed! Ready to deploy to Vercel.\n');
  console.log('Run: pnpm run deploy\n');
  process.exit(0);
}
