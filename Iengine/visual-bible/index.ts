/**
 * Visual Bible — Master Index
 * The highest-level design authority for the CoinDaily visual identity.
 */

export { cameraRules, getCameraDirective } from './camera';
export { lightingRules, getLightingDirective } from './lighting';
export { colorPalettes, getColorPalette, buildColorInstruction } from './color';
export { symbolSets, getSymbols, getSymbolContexts } from './symbolism';
export { motionRules, getMotionDirective } from './motion';
export { compositionRules, getCompositionDirective } from './composition';
export { regionalProfiles, getRegionalProfile, buildRegionalInstruction } from './regional';
export { storyTypeConfigs, detectStoryType, getStoryTypeConfig } from './storytypes';
export { universalNegatives, domainNegatives, buildNegativePrompt, getDomainFromStoryType } from './negative-rules';
export { getStyle } from './visualBible';

