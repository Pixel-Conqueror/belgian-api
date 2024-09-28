import path from 'node:path';
import url from 'node:url';

// Ugly workaround to import package.json without experiemental TS warning
// Source : https://github.com/nodejs/node/issues/51347#issuecomment-2111337854
import { createRequire } from 'node:module';
const packageJson = createRequire(import.meta.url)('../package.json');

export default {
  path: path.dirname(url.fileURLToPath(import.meta.url)) + '/../', //
  title: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,
  tagIndex: 3,
  info: {
    title: packageJson.name,
    version: packageJson.version,
    description: packageJson.description,
  },
  snakeCase: true,
  common: {
    parameters: {}, // OpenAPI conform parameters that are commonly used
    headers: {}, // OpenAPI conform headers that are commonly used
  },
  ignore: ['/swagger', '/docs'],
  preferredPutPatch: 'PUT',
  authMiddlewares: ['auth', 'auth:api'],
  defaultSecurityScheme: 'BearerAuth',
  persistAuthorization: true,
  showFullPath: false,
};
