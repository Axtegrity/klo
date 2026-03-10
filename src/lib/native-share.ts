import { Capacitor } from "@capacitor/core";

export async function nativeShare(opts: { title: string; text?: string; url: string }) {
  if (!Capacitor.isNativePlatform()) {
    // Fallback: use Web Share API or copy to clipboard
    if (navigator.share) {
      return navigator.share(opts);
    }
    await navigator.clipboard.writeText(opts.url);
    return;
  }
  try {
    const { Share } = await import("@capacitor/share");
    await Share.share({
      title: opts.title,
      text: opts.text,
      url: opts.url,
      dialogTitle: opts.title,
    });
  } catch {}
}
