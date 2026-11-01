import type { MetadataRoute } from "next";
import { presentations } from "@/content/registry";
import { SITE_URL } from "@/lib/site";
export default function sitemap():MetadataRoute.Sitemap{return [{url:SITE_URL},...presentations.filter(p=>p.status!=="draft"&&(p.visibility||"public")==="public"&&!p.protected&&(!p.expiresAt||new Date(p.expiresAt)>=new Date())).map(p=>({url:`${SITE_URL}/${p.slug}`}))];}
