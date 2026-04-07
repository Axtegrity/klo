import nextConfig from "eslint-config-next";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import securityConfig from './eslint-security.config.js';

const eslintConfig = [
  ...nextConfig,
  ...nextCoreWebVitals,
  ...nextTypescript,
  ...securityConfig,
];

export default eslintConfig;
