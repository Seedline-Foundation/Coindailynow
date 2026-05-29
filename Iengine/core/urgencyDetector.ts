import urgencyTriggers from '../data/urgencyTriggers.json';
import { UrgencyLevel } from '../types';

export class UrgencyDetector {
  detect(text: string): UrgencyLevel {
    for (const level of ['critical', 'high', 'medium', 'low'] as UrgencyLevel[]) {
      const triggers = (urgencyTriggers as Record<string, string[]>)[level];
      if (triggers) {
        for (const kw of triggers) {
          if (text.includes(kw)) return level;
        }
      }
    }
    return 'medium';
  }
}

export default UrgencyDetector;
