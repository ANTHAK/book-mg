/**
 * 后端 API 基础地址。
 *
 * 生产或联调时可通过 VITE_API_BASE_URL 覆盖；默认连接本地 Nest 服务。
 */
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export const API_BASE_URL =
  configuredApiBaseUrl?.trim()
    ? configuredApiBaseUrl.replace(/\/$/, '')
    : 'http://localhost:3000';
