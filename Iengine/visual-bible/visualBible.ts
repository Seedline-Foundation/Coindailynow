import * as fs from 'fs';
import * as path from 'path';

/**
 * Visual Bible Style Loader
 * Exposes access to canonical brand rules and visual styles.
 */
export function getStyle(category: string, field: string): any {
  try {
    const filePath = path.join(__dirname, category, `${field}.json`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error: any) {
    console.error(`[VisualBible] Failed to load style: ${category}/${field}`, error.message);
  }
  return null;
}

export default { getStyle };
