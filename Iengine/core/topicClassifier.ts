import topicKeywords from '../data/topicKeywords.json';

export class TopicClassifier {
  classify(text: string): string {
    let bestTopic = 'crypto';
    let bestScore = 0;

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (!Array.isArray(keywords)) continue;
      let score = 0;
      for (const kw of keywords) {
        if (text.includes(kw)) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        bestTopic = topic;
      }
    }

    return bestTopic;
  }
}

export default TopicClassifier;
