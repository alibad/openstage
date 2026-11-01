import type { Metadata } from "next";
import PresentationGallery from "@/components/presentation-gallery";
import { SITE_URL, SITE_TITLE, SITE_DESCRIPTION } from "@/lib/site";

export const metadata: Metadata = { title: { absolute: SITE_TITLE }, description: SITE_DESCRIPTION, alternates: { canonical: SITE_URL }, openGraph: { type: "website", siteName: "Openstage", url: SITE_URL, title: SITE_TITLE, description: SITE_DESCRIPTION, images: [{url: `${SITE_URL}/api/og`, width:1200,height:630,alt:"Openstage — interactive presentations by Human Quest"}] }, twitter: {card:"summary_large_image",title:SITE_TITLE,description:SITE_DESCRIPTION,images:[`${SITE_URL}/api/og`]} };

export default function HomePage(){
 const data={"@context":"https://schema.org","@graph":[{"@type":"WebSite",name:"Openstage",url:SITE_URL,publisher:{"@type":"Organization",name:"Human Quest",url:"https://www.humanquest.net/"}},{"@type":"SoftwareApplication",name:"Openstage",url:SITE_URL,description:SITE_DESCRIPTION,applicationCategory:"MultimediaApplication",operatingSystem:"Web",codeRepository:"https://github.com/alibad/openstage",isPartOf:{"@type":"CollectionPage",name:"Human Quest AI Patterns",url:"https://www.humanquest.net/ai-patterns"}}]};
 return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(data).replace(/</g,"\\u003c")}}/><PresentationGallery/></>;
}
