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

// Split mammoth HTML into pages at block boundaries (~1800 chars each)
function paginateHtml(html: string, targetChars = 1800): string[] {
  const blockRe = /<(p|h[1-6]|ul|ol|blockquote|hr|table)[\s>]/gi;
  const splits: number[] = [0];
  let lastSplit = 0;
  let m: RegExpExecArray | null;

  while ((m = blockRe.exec(html)) !== null) {
    if (m.index > 0 && m.index - lastSplit >= targetChars) {
      splits.push(m.index);
      lastSplit = m.index;
    }
  }

  const pages: string[] = [];
  for (let i = 0; i < splits.length; i++) {
    const chunk = html.slice(splits[i], splits[i + 1] ?? html.length).trim();
    if (chunk) pages.push(chunk);
  }
  return pages.length ? pages : [html];
}

export default async function DocumentViewerPage({ searchParams }: Props) {
  const { url = "", name = "Document" } = await searchParams;

  const isDocx = url.toLowerCase().match(/\.docx?$/);
  const html = isDocx ? await convertDocxToHtml(url) : null;
  const docPages = html ? paginateHtml(html) : null;

  return (
    <DocumentViewerClient
      url={url}
      name={decodeURIComponent(name)}
      docPages={docPages}
    />
  );
}
