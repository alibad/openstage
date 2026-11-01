import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
export default function robots():MetadataRoute.Robots{return {rules:[{userAgent:"*",allow:["/","/api/og"],disallow:["/admin/","/auth/","/api/","/settings","/onboarding","/share/"]}],sitemap:`${SITE_URL}/sitemap.xml`};}
