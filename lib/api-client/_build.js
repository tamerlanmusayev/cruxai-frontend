// Generates service.ts from the running backend's OpenAPI spec.
// Usage: start the API (http://localhost:4000), then `npm run gen:api`.
// Mirrors fe-booking/src/api/api-client-new/_build.js.
const { codegen } = require('swagger-axios-codegen');

const REMOTE =
  process.env.OPENAPI_URL || 'http://localhost:4000/openapi.json';

codegen({
  methodNameMode: 'operationId',
  remoteUrl: REMOTE,
  outputDir: __dirname,
  fileName: 'service.ts',
  useStaticMethod: true,
  multipleFileMode: false,
}).then(
  () => console.log('Generated lib/api-client/service.ts from', REMOTE),
  (e) => {
    console.error('Codegen failed:', e?.message ?? e);
    process.exit(1);
  },
);
