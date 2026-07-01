"use client";

import { createContext, useContext, type ReactNode } from "react";
import { SITE, type SiteConfig } from "@/lib/site";

const SiteConfigContext = createContext<SiteConfig>(SITE);

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  return <SiteConfigContext.Provider value={SITE}>{children}</SiteConfigContext.Provider>;
}

export function useSiteConfig(): SiteConfig {
  return useContext(SiteConfigContext);
}
