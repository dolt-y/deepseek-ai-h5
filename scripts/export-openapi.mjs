import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const backendDir = resolve('wechat-ai-backend');
const outFile = resolve('wechat-ai-backend/docs/openapi.json');

process.chdir(backendDir);
const swaggerUrl = new URL('./swagger.js', pathToFileURL(`${backendDir}/`));
const { swaggerSpec } = await import(swaggerUrl);

const payload = JSON.stringify(swaggerSpec, null, 2);

await writeFile(outFile, payload, 'utf-8');
console.log(`[openapi] wrote ${outFile}`);
