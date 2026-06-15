import { Capacitor } from "@capacitor/core";

export async function nativeShare(opts: { title: string; text?: string; url: string }): Promise<{ copied: boolean }> {
  if (!Capacitor.isNativePlatform()) {
    if (navigator.share) {
      await navigator.share(opts);
      return { copied: false };
    }
    await navigator.clipboard.writeText(opts.url);
    return { copied: true };
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
  return { copied: false };
}
