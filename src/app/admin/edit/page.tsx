// /admin/edit — Visual click-to-edit home-page editor.
//
// Server component: fetches current page_configs.home from Supabase, then
// passes the config to the HomeEditor client component which renders the
// real home page in edit mode with click-to-swap image overlays.
//
// Auth: inherited from src/app/admin/layout.tsx — no additional check needed
// here since the /admin segment's layout already redirects unauthenticated
// users to /auth/signin.

import { getPageConfig } from "@/lib/page-config-server";
import HomeEditor from "./HomeEditor";

export const dynamic = "force-dynamic";

export default async function VisualEditorPage() {
  const pageConfig = await getPageConfig("home");

  return (
    <HomeEditor
      initialHeroConfig={pageConfig?.hero_config ?? null}
      initialSectionImages={pageConfig?.section_images ?? null}
    />
  );
}
