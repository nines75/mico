import {
  createProxyService,
  type ProxyServiceKey,
} from "@webext-core/proxy-service";
import type { proxyService } from "./proxy-service";

export const PROXY_SERVICE_KEY = "proxy" as ProxyServiceKey<
  typeof proxyService
>;
export const proxy = createProxyService(PROXY_SERVICE_KEY);
