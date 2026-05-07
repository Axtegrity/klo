import mammoth from "mammoth";
import DocumentViewerClient from "./DocumentViewerClient";

interface Props {
  searchParams: Promise<{ url?: string; name?: string }>;
}

async function convertDocxToHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const result = await mammoth.convertToHtml({ buffer });
    return result.value || null;
  } catch {
    return null;
  }
}

export default async function DocumentViewerPage({ searchParams }: Props) {
  const { url = "", name = "Document" } = await searchParams;

  const isDocx = url.toLowerCase().match(/\.docx?$/);
  const htmlContent = isDocx ? await convertDocxToHtml(url) : null;

  return (
    <DocumentViewerClient
      url={url}
      name={decodeURIComponent(name)}
      htmlContent={htmlContent}
    />
  );
}
