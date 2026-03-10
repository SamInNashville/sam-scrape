// Adds shebang to dist/bin/cli.js and makes it executable
import { readFileSync, writeFileSync, chmodSync } from 'fs';

const cli = 'dist/bin/cli.js';
const content = readFileSync(cli, 'utf8');
if (!content.startsWith('#!/usr/bin/env node')) {
  writeFileSync(cli, '#!/usr/bin/env node\n' + content, 'utf8');
}
chmodSync(cli, 0o755);
console.log('✓ Shebang added to dist/bin/cli.js');
