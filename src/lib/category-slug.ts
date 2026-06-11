export function categoryToSlug(category: string): string {
  return category
    .toLowerCase()
    .replace(/[^\w-]/g, "-") // Replace non-word chars (excluding dash) with dash
    .replace(/-+/g, "-") // Collapse multiple dashes
    .replace(/^-+|-+$/g, ""); // Trim leading/trailing dashes
}
