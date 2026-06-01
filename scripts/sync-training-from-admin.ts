/**
 * sync-training-from-admin.ts
 * 
 * Generates training documentation snippets from admin interface definitions.
 * Keeps training in sync with actual admin code by extracting tab definitions
 * and generating the boilerplate training sections.
 * 
 * Usage: bun run scripts/sync-training-from-admin.ts [--dry-run]
 */

import fs from 'fs';
import path from 'path';

interface AdminTab {
  id: string;
  label: string;
}

const ADMIN_PAGE_PATH = path.join(process.cwd(), 'src/app/admin/page.tsx');
const TRAINING_PAGE_PATH = path.join(process.cwd(), 'src/app/admin/training/page.tsx');

// Extract TABS from admin/page.tsx
function extractAdminTabs(): AdminTab[] {
  const content = fs.readFileSync(ADMIN_PAGE_PATH, 'utf-8');
  const tabsMatch = content.match(/const TABS:.*?\] = \[([\s\S]*?)\];/);
  
  if (!tabsMatch) {
    throw new Error('Could not find TABS constant in admin/page.tsx');
  }
  
  const tabs: AdminTab[] = [];
  const tabLines = tabsMatch[1].match(/\{ id: "([^"]*)"[^}]*label: "([^"]*)"[^}]*\}/g) || [];
  
  tabLines.forEach(line => {
    const idMatch = line.match(/id: "([^"]*)"/);
    const labelMatch = line.match(/label: "([^"]*)"/);
    
    if (idMatch && labelMatch) {
      tabs.push({
        id: idMatch[1],
        label: labelMatch[1]
      });
    }
  });
  
  return tabs;
}

// Generate a training section template
function generateTrainingSection(tab: AdminTab, index: number): string {
  const kebabId = tab.id.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
  
  return `  {
    id: "${kebabId}",
    title: "${tab.label}",
    icon: FileText,
    description: "Step-by-step guide for managing ${tab.label}",
    adminTab: "${tab.id}",
    steps: [
      {
        number: 1,
        title: "Open the ${tab.label} tab",
        instructions: "Click the ${tab.label} tab in the admin dashboard",
        details: "This tab contains tools and options for managing ${tab.label}. You will see various controls and settings here."
      }
    ],
    tips: [
      "Take your time exploring each option",
      "Use the Refresh button to see the latest data",
      "Refer to the Request Update button if you have questions"
    ]
  }`;
}

// Generate tab MAP entry
function generateTabMapEntry(tab: AdminTab): string {
  return `  "${tab.id}": {
    label: "${tab.label}",
    icon: FileText,
    color: "blue",
    category: "management"
  }`;
}

// Main
function main() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔄 Generating training section templates from admin interface...\n');
  
  const adminTabs = extractAdminTabs();
  
  console.log(`📊 Found ${adminTabs.length} admin tabs\n`);
  
  console.log('📝 Generated training sections:\n');
  adminTabs.forEach((tab, i) => {
    console.log(generateTrainingSection(tab, i));
    if (i < adminTabs.length - 1) console.log(',');
  });
  
  console.log('\n\n📋 Generated TAB_MAP entries:\n');
  adminTabs.forEach((tab, i) => {
    console.log(generateTabMapEntry(tab));
    if (i < adminTabs.length - 1) console.log(',');
  });
  
  console.log('\n\n✅ Template generation complete');
  console.log('⚠️  NOTE: These are templates — customize descriptions, steps, and tips manually');
  console.log('💡 Use these as a starting point, then enhance with specific workflows');
}

try {
  main();
} catch (error) {
  console.error('❌ Generator error:', error);
  process.exit(1);
}
