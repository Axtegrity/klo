import mammoth from "mammoth";
import DocumentViewerClient from "./DocumentViewerClient";

interface Props {
  searchParams: Promise<{ url?: string; name?: string }>;
}

const PERMITTED_DOCUMENT_HOSTS = [
  "keithlodom.ai",
  "supabase.co", // matches *.supabase.co — project storage buckets
];

function isUrlPermitted(raw: string): boolean {
  try {
    const { hostname } = new URL(raw);
    return PERMITTED_DOCUMENT_HOSTS.some(
      (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`)
    );
  } catch {
    return false;
  }
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

  if (!isUrlPermitted(url)) {
    return (
      <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
        <h1>Document URL not permitted.</h1>
      </div>
    );
  }

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
