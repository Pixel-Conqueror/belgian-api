import path from 'node:path';
import url from 'node:url';
import packageJson from '../package.json' with { type: 'json' };

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
