import regionEntities from '../data/regionEntities.json';

export class RegionDetector {
  detect(text: string): string {
    let bestRegion = 'global';
    let bestScore = 0;

    for (const [region, entities] of Object.entries(regionEntities)) {
      if (!Array.isArray(entities)) continue;
      let score = 0;
      for (const kw of entities) {
        if (text.includes(kw)) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        bestRegion = region;
      }
    }

    return bestRegion;
  }
}

export default RegionDetector;
