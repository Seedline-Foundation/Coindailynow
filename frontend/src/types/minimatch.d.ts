// Type definitions for minimatch
declare module 'minimatch' {
  interface MinimatchOptions {
    debug?: boolean;
    nobrace?: boolean;
    noglobstar?: boolean;
    dot?: boolean;
    noext?: boolean;
    nocase?: boolean;
    nonull?: boolean;
    matchBase?: boolean;
    nocomment?: boolean;
    nonegate?: boolean;
    flipNegate?: boolean;
  }

  class Minimatch {
    constructor(pattern: string, options?: MinimatchOptions);
    match(fname: string): boolean;
    matchOne(fileArray: string[], patternArray: string[], partial: boolean): boolean;
  }

  function minimatch(target: string, pattern: string, options?: MinimatchOptions): boolean;
  namespace minimatch {
    export = minimatch;
  }

  export = minimatch;
}