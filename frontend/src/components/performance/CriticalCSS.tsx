import { promises as fs } from 'fs';
import path from 'path';

export default async function CriticalCSS({ pagePath = '/' }: { pagePath?: string }) {
  const cssMap: Record<string, string> = {
    '/': 'critical-home.css',
  };

  const cssFile = cssMap[pagePath];
  if (!cssFile) return null;

  try {
    const cssPath = path.join(process.cwd(), 'public', 'critical', cssFile);
    const css = await fs.readFile(cssPath, 'utf-8');
    return <style data-critical-css dangerouslySetInnerHTML={{ __html: css }} />;
  } catch {
    return null;
  }
}
