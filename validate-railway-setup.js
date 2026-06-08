#!/usr/bin/env node

/**
 * Railway Backend Deployment Validation Script
 * 
 * This script validates your monorepo backend configuration before deploying to Railway.
 * It checks:
 * - Project structure
 * - Build scripts
 * - Environment variables
 * - Database configuration
 * - Docker/Dockerfile compatibility
 * 
 * Usage:
 *   node validate-railway-setup.js
 * 
 * Exit codes:
 *   0 = All checks passed
 *   1 = Some checks failed
 *   2 = Critical checks failed
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset}  ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset}  ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset}  ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset}  ${msg}`),
  debug: (msg) => console.log(`${colors.cyan}→${colors.reset}  ${msg}`),
  section: (msg) => console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n${msg}\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`),
};

let passCount = 0;
let failCount = 0;
let warningCount = 0;

function check(condition, message) {
  if (condition) {
    log.success(message);
    passCount++;
    return true;
  } else {
    log.error(message);
    failCount++;
    return false;
  }
}

function warn(condition, message) {
  if (!condition) {
    log.warning(message);
    warningCount++;
  } else {
    log.success(message);
    passCount++;
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function readTextFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function getCurrentDirectory() {
  // Detect if we're at the root or in the api directory
  const apiPackageJson = path.join(process.cwd(), 'package.json');
  const rootPackageJson = path.join(process.cwd(), '..', '..', 'package.json');

  if (fileExists(apiPackageJson)) {
    const pkg = readJsonFile(apiPackageJson);
    if (pkg && pkg.name === '@distro/api') {
      return process.cwd(); // We're in /apps/api
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Validation
// ─────────────────────────────────────────────────────────────────────────────

log.section('🚀 Railway Backend Deployment Validation\n');

// Find the API directory
let apiDir = path.join(process.cwd(), 'apps', 'api');
let rootDir = process.cwd();

if (!fileExists(path.join(apiDir, 'package.json'))) {
  // Try running from api directory
  if (fileExists(path.join(process.cwd(), 'package.json'))) {
    const pkg = readJsonFile(path.join(process.cwd(), 'package.json'));
    if (pkg && pkg.name === '@distro/api') {
      apiDir = process.cwd();
      rootDir = path.join(process.cwd(), '..', '..');
    }
  }
}

log.info(`Root directory: ${rootDir}`);
log.info(`API directory: ${apiDir}`);

// ─────────────────────────────────────────────────────────────────────────────
// 1. PROJECT STRUCTURE
// ─────────────────────────────────────────────────────────────────────────────

log.section('1️⃣  PROJECT STRUCTURE');

check(fileExists(path.join(rootDir, 'package.json')), 'Root package.json exists');
check(fileExists(path.join(rootDir, 'turbo.json')), 'Root turbo.json exists');
check(fileExists(path.join(rootDir, 'apps')), 'apps/ directory exists');
check(fileExists(apiDir), 'apps/api/ directory exists');
check(fileExists(path.join(apiDir, 'package.json')), 'apps/api/package.json exists');
check(fileExists(path.join(apiDir, 'src')), 'apps/api/src/ directory exists');
check(fileExists(path.join(apiDir, 'src', 'main.ts')), 'apps/api/src/main.ts exists');
check(fileExists(path.join(apiDir, 'prisma')), 'apps/api/prisma/ directory exists');
check(fileExists(path.join(apiDir, 'prisma', 'schema.prisma')), 'Prisma schema exists');
check(fileExists(path.join(rootDir, 'packages', 'shared-types')), 'packages/shared-types/ exists');

// ─────────────────────────────────────────────────────────────────────────────
// 2. PACKAGE.JSON CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

log.section('2️⃣  PACKAGE.JSON CONFIGURATION');

const apiPackageJson = readJsonFile(path.join(apiDir, 'package.json'));
const rootPackageJson = readJsonFile(path.join(rootDir, 'package.json'));

check(apiPackageJson, 'API package.json is valid JSON');
check(rootPackageJson, 'Root package.json is valid JSON');

if (apiPackageJson) {
  check(apiPackageJson.name === '@distro/api', 'API package name is @distro/api');
  check(apiPackageJson.scripts && apiPackageJson.scripts.build, 'API has build script');
  check(apiPackageJson.scripts && apiPackageJson.scripts.start, 'API has start script');
  
  if (apiPackageJson.scripts) {
    const buildScript = apiPackageJson.scripts.build;
    const startScript = apiPackageJson.scripts.start;
    
    check(buildScript.includes('nest build'), `Build script is "nest build" (found: ${buildScript})`);
    check(startScript.includes('node dist/src/main.js'), `Start script uses node (found: ${startScript})`);
    
    warn(!buildScript.includes('npm run dev'), 'Build script does not use dev mode');
    warn(!startScript.includes('npm run dev'), 'Start script does not use dev mode');
  }

  const deps = apiPackageJson.dependencies || {};
  const devDeps = apiPackageJson.devDependencies || {};
  
  check(deps['@nestjs/core'], '@nestjs/core is installed');
  check(deps['@nestjs/common'], '@nestjs/common is installed');
  check(deps['@prisma/client'], '@prisma/client is installed');
  check(devDeps['prisma'], 'prisma is in devDependencies');
  check(devDeps['@nestjs/cli'], '@nestjs/cli is in devDependencies');
}

if (rootPackageJson) {
  check(rootPackageJson.engines, 'Root has engines configuration');
  if (rootPackageJson.engines) {
    const nodeVersion = rootPackageJson.engines.node;
    warn(nodeVersion && nodeVersion.includes('20'), `Node version is 20.x (found: ${nodeVersion})`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. SOURCE CODE
// ─────────────────────────────────────────────────────────────────────────────

log.section('3️⃣  SOURCE CODE VALIDATION');

const mainTs = readTextFile(path.join(apiDir, 'src', 'main.ts'));

check(mainTs, 'main.ts exists and is readable');

if (mainTs) {
  check(mainTs.includes('NestFactory.create'), 'main.ts uses NestFactory.create()');
  check(mainTs.includes('listen'), 'main.ts calls app.listen()');
  check(mainTs.includes('0.0.0.0'), 'main.ts listens on 0.0.0.0 (Railway requirement)');
  check(mainTs.includes('ensureDatabaseUrl'), 'main.ts has DATABASE_URL validation');
  check(mainTs.includes('enableCors'), 'main.ts enables CORS');
}

const nestCliJson = readJsonFile(path.join(apiDir, 'nest-cli.json'));
check(nestCliJson, 'nest-cli.json is valid');

if (nestCliJson) {
  check(nestCliJson.sourceRoot === 'src', `nest-cli.json sourceRoot is 'src' (found: ${nestCliJson.sourceRoot})`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. CONFIGURATION FILES
// ─────────────────────────────────────────────────────────────────────────────

log.section('4️⃣  CONFIGURATION FILES');

check(fileExists(path.join(apiDir, 'tsconfig.json')), 'tsconfig.json exists');
check(fileExists(path.join(apiDir, '.env.example')), '.env.example exists');

const tsconfigJson = readJsonFile(path.join(apiDir, 'tsconfig.json'));
if (tsconfigJson) {
  check(tsconfigJson.compilerOptions && tsconfigJson.compilerOptions.outDir === './dist', 'TypeScript compiles to dist/');
  check(tsconfigJson.compilerOptions && tsconfigJson.compilerOptions.rootDir === './', 'TypeScript rootDir is ./');
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. ENVIRONMENT VARIABLES
// ─────────────────────────────────────────────────────────────────────────────

log.section('5️⃣  ENVIRONMENT VARIABLES');

const envExample = readTextFile(path.join(apiDir, '.env.example'));
if (envExample) {
  check(envExample.includes('DATABASE_URL'), '.env.example has DATABASE_URL');
  check(envExample.includes('JWT_ACCESS_SECRET'), '.env.example has JWT_ACCESS_SECRET');
  check(envExample.includes('JWT_REFRESH_SECRET'), '.env.example has JWT_REFRESH_SECRET');
  check(envExample.includes('CORS_ORIGINS'), '.env.example has CORS_ORIGINS');
  check(envExample.includes('NODE_ENV'), '.env.example has NODE_ENV');
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. BUILD & RUNTIME
// ─────────────────────────────────────────────────────────────────────────────

log.section('6️⃣  BUILD & RUNTIME CHECK');

try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  log.debug(`npm version: ${npmVersion}`);
  check(npmVersion, `npm is installed (${npmVersion})`);
} catch {
  log.error('npm is not installed');
  failCount++;
}

try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  log.debug(`node version: ${nodeVersion}`);
  check(nodeVersion, `node is installed (${nodeVersion})`);
} catch {
  log.error('node is not installed');
  failCount++;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. DOCKER (Optional)
// ─────────────────────────────────────────────────────────────────────────────

log.section('7️⃣  DOCKER CONFIGURATION (Optional)');

const dockerfile = fileExists(path.join(apiDir, 'Dockerfile'));
if (dockerfile) {
  check(dockerfile, 'Dockerfile exists');
  
  const dockerfileContent = readTextFile(path.join(apiDir, 'Dockerfile'));
  if (dockerfileContent) {
    check(dockerfileContent.includes('FROM node:20'), 'Dockerfile uses Node 20');
    check(dockerfileContent.includes('WORKDIR /app'), 'Dockerfile sets WORKDIR');
    check(dockerfileContent.includes('npm ci'), 'Dockerfile uses npm ci');
    check(dockerfileContent.includes('prisma generate'), 'Dockerfile generates Prisma client');
    check(dockerfileContent.includes('npm run build'), 'Dockerfile builds the project');
    check(dockerfileContent.includes('node ./apps/api/dist/src/main.js') || dockerfileContent.includes('./dist/src/main.js'), 'Dockerfile starts the server');
  }
} else {
  log.info('Dockerfile not found (OK if using build/start commands)');
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. TURBO CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

log.section('8️⃣  TURBO CONFIGURATION');

if (rootPackageJson && rootPackageJson.workspaces) {
  check(rootPackageJson.workspaces.length > 0, 'Root has workspace configuration');
}

const turboJson = readJsonFile(path.join(rootDir, 'turbo.json'));
if (turboJson) {
  check(turboJson.pipeline && turboJson.pipeline.build, 'Turbo has build pipeline');
  if (turboJson.globalEnv) {
    check(turboJson.globalEnv.includes('DATABASE_URL'), 'Turbo passes DATABASE_URL globally');
    check(turboJson.globalEnv.includes('NODE_ENV'), 'Turbo passes NODE_ENV globally');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. SHARED TYPES
// ─────────────────────────────────────────────────────────────────────────────

log.section('9️⃣  SHARED TYPES');

check(fileExists(path.join(rootDir, 'packages', 'shared-types', 'package.json')), 'shared-types package.json exists');
check(fileExists(path.join(rootDir, 'packages', 'shared-types', 'src')), 'shared-types src/ exists');

if (apiPackageJson && apiPackageJson.dependencies) {
  check(apiPackageJson.dependencies['@distro/shared-types'], '@distro/shared-types is imported');
}

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

log.section('📊 VALIDATION SUMMARY');

console.log(`\n${colors.green}✓ Passed: ${passCount}${colors.reset}`);
console.log(`${colors.yellow}⚠ Warnings: ${warningCount}${colors.reset}`);
console.log(`${colors.red}✗ Failed: ${failCount}${colors.reset}\n`);

if (failCount === 0) {
  log.success('✨ All critical checks passed!');
  console.log(`
${colors.green}Your project is ready for Railway deployment.${colors.reset}

Next steps:
1. Set up PostgreSQL service on Railway
2. Configure the backend service:
   - Root Directory: ./apps/api
   - Build Command: npm run build
   - Start Command: npx prisma migrate deploy --schema=./prisma/schema.prisma && node ./dist/src/main.js
3. Connect PostgreSQL to backend service
4. Add environment variables to backend service
5. Deploy!

See RAILWAY_DEPLOYMENT_GUIDE.md for detailed instructions.
  `);
  process.exit(0);
} else {
  log.error('⚠️  Some checks failed. Please fix the issues above before deploying.');
  console.log(`\n${colors.red}Failed items:${colors.reset}`);
  console.log('- Review the errors marked with ✗ above');
  console.log('- See RAILWAY_TROUBLESHOOTING.md for help');
  console.log('- Fix issues locally, then redeploy to Railway\n');
  process.exit(1);
}
