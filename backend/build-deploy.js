const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname);
const deployDir = path.join(rootDir, 'deploy');
const distDir = path.join(rootDir, 'dist');
const distFunctionsDir = path.join(distDir, 'functions');
const distLibDir = path.join(distDir, 'lib');

const functions = [
  'admin',
  'ai',
  'deliveries',
  'events',
  'listings',
  'messages',
  'notifications',
  'transactions',
  'users'
];

const metadata = {
  users: {
    env: ['COGNITO_USER_POOL_ID'],
    iam: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:Query', 'dynamodb:Scan', 'dynamodb:UpdateItem', 'cognito-idp:AdminGetUser', 'cognito-idp:AdminCreateUser', 'cognito-idp:AdminDeleteUser', 'cognito-idp:AdminUpdateUserAttributes', 'cognito-idp:AdminDisableUser'],
    routes: ['GET /users', 'GET /users/{userId}', 'POST /users', 'PUT /users/{userId}', 'DELETE /users/{userId}']
  },
  listings: {
    env: ['S3_BUCKET_NAME'],
    iam: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:Query', 'dynamodb:Scan', 'dynamodb:UpdateItem', 'dynamodb:DeleteItem', 's3:PutObject', 's3:GetObject'],
    routes: ['GET /listings', 'GET /listings/{listingId}', 'POST /listings', 'POST /listings/upload-urls', 'PUT /listings/{listingId}', 'DELETE /listings/{listingId}']
  },
  admin: {
    env: [],
    iam: ['dynamodb:Scan', 'dynamodb:Query', 'dynamodb:UpdateItem', 'dynamodb:DeleteItem', 'cognito-idp:AdminDisableUser'],
    routes: ['GET /admin/users', 'GET /admin/listings', 'GET /admin/transactions', 'PUT /admin/users/{userId}/status', 'PUT /admin/listings/{listingId}/status']
  }
};

if (!fs.existsSync(deployDir)) {
  fs.mkdirSync(deployDir);
}

functions.forEach(func => {
  console.log(`Processing ${func}...`);
  const funcDeployDir = path.join(deployDir, func);
  const funcTargetDir = path.join(funcDeployDir, 'functions', func);
  const libTargetDir = path.join(funcDeployDir, 'lib');
  const nodeModulesTargetDir = path.join(funcDeployDir, 'node_modules');
  
  // Create directories
  fs.mkdirSync(funcTargetDir, { recursive: true });
  fs.mkdirSync(libTargetDir, { recursive: true });
  
  // Copy handler files
  const handlerSrc = path.join(distFunctionsDir, func, 'handler.js');
  const handlerMapSrc = path.join(distFunctionsDir, func, 'handler.js.map');
  
  if (fs.existsSync(handlerSrc)) {
    fs.copyFileSync(handlerSrc, path.join(funcTargetDir, 'handler.js'));
  } else {
    console.warn(`WARNING: handler.js not found for ${func}`);
  }
  
  if (fs.existsSync(handlerMapSrc)) {
    fs.copyFileSync(handlerMapSrc, path.join(funcTargetDir, 'handler.js.map'));
  }
  
  // Copy lib directory recursively
  const copyDir = (src, dest) => {
    if (!fs.existsSync(src)) return;
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (let entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };
  copyDir(distLibDir, libTargetDir);
  
  // Copy package.json and package-lock.json
  fs.copyFileSync(path.join(rootDir, 'package.json'), path.join(funcDeployDir, 'package.json'));
  if (fs.existsSync(path.join(rootDir, 'package-lock.json'))) {
    fs.copyFileSync(path.join(rootDir, 'package-lock.json'), path.join(funcDeployDir, 'package-lock.json'));
  }
  
  // Manually copy root node_modules
  const nodeModulesSrc = path.join(rootDir, 'node_modules');
  if (fs.existsSync(nodeModulesSrc)) {
    console.log(`  Copying node_modules for ${func}...`);
    try {
      fs.cpSync(nodeModulesSrc, nodeModulesTargetDir, { recursive: true, force: true });
    } catch (e) {
      console.error(`  Error copying node_modules for ${func}:`, e.message);
    }
  }
  
  // Generate README.md
  const meta = metadata[func] || { env: [], iam: [], routes: [] };
  const readmeContent = `# Lambda Deployment: ${func}

## Details
- **Lambda Name:** ${func}
- **Runtime:** Node.js 22.x
- **Handler:** functions/${func}/handler.handler

## Environment Variables
${meta.env.length > 0 ? meta.env.map(e => `- \`${e}\``).join('\n') : '- *None required*'}

## IAM Permissions
${meta.iam.length > 0 ? meta.iam.map(p => `- \`${p}\``).join('\n') : '- *None required*'}

## API Gateway Routes
${meta.routes.length > 0 ? meta.routes.map(r => `- \`${r}\``).join('\n') : '- *None required*'}
`;
  
  fs.writeFileSync(path.join(funcDeployDir, 'README.md'), readmeContent);
  
  // Verify package
  const handlerExists = fs.existsSync(path.join(funcTargetDir, 'handler.js'));
  const libExists = fs.existsSync(path.join(libTargetDir, 'response.js')) || fs.existsSync(path.join(libTargetDir, 'response.js.map'));
  const nodeModulesExists = fs.existsSync(nodeModulesTargetDir);
  const packageJsonExists = fs.existsSync(path.join(funcDeployDir, 'package.json'));
  
  console.log(`  Verification:`);
  console.log(`  - handler.js exists: ${handlerExists ? '✅' : '❌'}`);
  console.log(`  - lib/ exists: ${libExists ? '✅' : '❌'}`);
  console.log(`  - node_modules/ exists: ${nodeModulesExists ? '✅' : '❌'}`);
  console.log(`  - package.json exists: ${packageJsonExists ? '✅' : '❌'}`);
  console.log('-----------------------------------');
});

console.log('Deployment packaging complete for missing folders!');
