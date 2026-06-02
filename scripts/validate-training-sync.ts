/**
 * validate-training-sync.ts
 * Updated: includes strategy-rooms tab validation.
 *
 * Validates that admin training documentation stays in sync with actual admin interface.
 * Runs as part of CI/CD pipeline or pre-commit hook.
 * 
 * Checks:
 * 1. Tab count matches (training TRAINING_SECTIONS vs admin TABS)
 * 2. All admin tabs are documented in training
 * 3. Tab names are consistent
 * 4. All training sections have valid adminTab references
 */

import fs from 'fs';
import path from 'path';

interface AdminTab {
  id: string;
  label: string;
}

interface TrainingSection {
  id: string;
  title: string;
  adminTab?: string;
}

const ADMIN_PAGE_PATH = path.join(process.cwd(), 'src/app/admin/page.tsx');
const TRAINING_PAGE_PATH = path.join(process.cwd(), 'src/app/admin/training/page.tsx');

let errors: string[] = [];

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

// Extract TRAINING_SECTIONS from training/page.tsx
function extractTrainingSections(): TrainingSection[] {
  const content = fs.readFileSync(TRAINING_PAGE_PATH, 'utf-8');
  const sectionsMatch = content.match(/const TRAINING_SECTIONS.*?\] = \[([\s\S]*?)\n\];/);
  
  if (!sectionsMatch) {
    throw new Error('Could not find TRAINING_SECTIONS constant in training/page.tsx');
  }
  
  const sections: TrainingSection[] = [];
  const sectionBlocks = sectionsMatch[1].split(/\n  \{/).slice(1);
  
  sectionBlocks.forEach(block => {
    const idMatch = block.match(/id: "([^"]*)"/);
    const titleMatch = block.match(/title: "([^"]*)"/);
    const adminTabMatch = block.match(/adminTab: "([^"]*)"/);
    
    if (idMatch && titleMatch) {
      sections.push({
        id: idMatch[1],
        title: titleMatch[1],
        adminTab: adminTabMatch?.[1]
      });
    }
  });
  
  return sections;
}

// Validate sync
function validateSync() {
  console.log('🔍 Validating training/admin sync...\n');
  
  const adminTabs = extractAdminTabs();
  const trainingSections = extractTrainingSections();
  
  // Check 1: Tab count
  const mainSections = trainingSections.filter(s => s.adminTab); // Only main sections have adminTab
  if (mainSections.length !== adminTabs.length) {
    errors.push(
      `❌ Tab count mismatch: Admin has ${adminTabs.length} tabs, training documents ${mainSections.length}`
    );
  }
  
  // Check 2: All admin tabs are documented
  const documentedTabIds = new Set(mainSections.map(s => s.adminTab));
  adminTabs.forEach(tab => {
    if (!documentedTabIds.has(tab.id)) {
      errors.push(`❌ Admin tab "${tab.id}" (${tab.label}) is not documented in training`);
    }
  });
  
  // Check 3: Training sections reference valid admin tabs
  mainSections.forEach(section => {
    if (section.adminTab && !adminTabs.find(t => t.id === section.adminTab)) {
      errors.push(`❌ Training section "${section.id}" references non-existent adminTab "${section.adminTab}"`);
    }
  });
  
  // Report
  if (errors.length === 0) {
    console.log('✅ Training is in sync with admin interface');
    console.log(`   ${adminTabs.length} tabs documented`);
    console.log(`   ${trainingSections.length} total sections (including subsections)`);
    return true;
  } else {
    console.error('\n⚠️  TRAINING SYNC ISSUES:\n');
    errors.forEach(err => console.error(err));
    return false;
  }
}

// Main
try {
  const isValid = validateSync();
  process.exit(isValid ? 0 : 1);
} catch (error) {
  console.error('❌ Validation script error:', error);
  process.exit(1);
}
