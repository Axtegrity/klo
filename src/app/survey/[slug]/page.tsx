import type { Metadata } from "next";
import { getServiceSupabase } from "@/lib/supabase";
import SurveyClient from "./SurveyClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = getServiceSupabase();
  const { data: survey } = await supabase
    .from("surveys")
    .select("title, description")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  const title = survey?.title ?? "Survey";
  const description =
    survey?.description ??
    "Take this survey on keithlodom.ai";

  return {
    title: `${title} | Keith L. Odom`,
    description,
    openGraph: {
      title,
      description,
      url: `https://keithlodom.ai/survey/${slug}`,
      siteName: "KLO | Keith L. Odom",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function SurveyPage({ params }: Props) {
  const { slug } = await params;
  return <SurveyClient slug={slug} />;
}
