import ts from 'typescript';

export interface ValidationError {
  line: number;
  column: number;
  message: string;
  category: 'error' | 'warning' | 'suggestion';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export const validateTypeScriptCode = (code: string): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  try {
    const sourceFile = ts.createSourceFile(
      'temp.ts',
      code,
      ts.ScriptTarget.ESNext,
      true
    );

    const compilerOptions: ts.CompilerOptions = {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      strict: false,
      noEmit: true,
      skipLibCheck: true,
      allowJs: true,
      esModuleInterop: true,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
    };

    const libSource = ts.createSourceFile(
      'lib.d.ts',
      `
        declare var JSON: any;
        declare var console: any;
        declare var Object: any;
        declare var String: any;
        declare var Number: any;
        declare var Boolean: any;
        declare var Math: any;
        declare var Date: any;
        declare var RegExp: any;
        
        // Error interface
        interface Error {
          name: string;
          message: string;
          stack?: string;
        }
        interface ErrorConstructor {
          new (message?: string): Error;
          (message?: string): Error;
        }
        declare var Error: ErrorConstructor;
        
        // Array interface with common methods
        interface Array<T> {
          length: number;
          push(...items: T[]): number;
          pop(): T | undefined;
          shift(): T | undefined;
          unshift(...items: T[]): number;
          map<U>(callbackfn: (value: T, index: number, array: T[]) => U): U[];
          filter(callbackfn: (value: T, index: number, array: T[]) => any): T[];
          forEach(callbackfn: (value: T, index: number, array: T[]) => void): void;
          reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U): U;
          find(predicate: (value: T, index: number, obj: T[]) => boolean): T | undefined;
          findIndex(predicate: (value: T, index: number, obj: T[]) => boolean): number;
          includes(searchElement: T, fromIndex?: number): boolean;
          indexOf(searchElement: T, fromIndex?: number): number;
          join(separator?: string): string;
          slice(start?: number, end?: number): T[];
          splice(start: number, deleteCount?: number, ...items: T[]): T[];
          concat(...items: (T | T[])[]): T[];
          reverse(): T[];
          sort(compareFn?: (a: T, b: T) => number): this;
          every(predicate: (value: T, index: number, array: T[]) => boolean): boolean;
          some(predicate: (value: T, index: number, array: T[]) => boolean): boolean;
          [n: number]: T;
        }
        interface ArrayConstructor {
          new <T>(...items: T[]): T[];
          isArray(arg: any): arg is any[];
          from<T>(arrayLike: any): T[];
        }
        declare var Array: ArrayConstructor;
        
        // Promise interface for async/await support
        interface Promise<T> {
          then<TResult1 = T, TResult2 = never>(
            onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
            onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
          ): Promise<TResult1 | TResult2>;
          catch<TResult = never>(
            onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
          ): Promise<T | TResult>;
        }
        interface PromiseLike<T> {
          then<TResult1 = T, TResult2 = never>(
            onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
            onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
          ): PromiseLike<TResult1 | TResult2>;
        }
        declare var Promise: PromiseConstructor;
        interface PromiseConstructor {
          new <T>(executor: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void): Promise<T>;
          resolve<T>(value: T | PromiseLike<T>): Promise<T>;
          reject<T = never>(reason?: any): Promise<T>;
          all<T>(values: (T | PromiseLike<T>)[]): Promise<T[]>;
        }
        
        declare function setTimeout(handler: any, timeout?: any, ...args: any[]): any;
        declare function setInterval(handler: any, timeout?: any, ...args: any[]): any;
        declare function clearTimeout(handle?: any): void;
        declare function clearInterval(handle?: any): void;
        declare function isNaN(value: any): boolean;
        declare function parseInt(string: string, radix?: number): number;
        declare function parseFloat(string: string): number;
        
        // TypeScript utility types
        type Pick<T, K extends keyof T> = {
          [P in K]: T[P];
        };
        type Required<T> = {
          [P in keyof T]-?: T[P];
        };
        type Partial<T> = {
          [P in keyof T]?: T[P];
        };
        type Readonly<T> = {
          readonly [P in keyof T]: T[P];
        };
        type Record<K extends string | number | symbol, T> = {
          [P in K]: T;
        };
        type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
        type Exclude<T, U> = T extends U ? never : T;
        type Extract<T, U> = T extends U ? T : never;
        type NonNullable<T> = T extends null | undefined ? never : T;
        
        // Test framework functions
        declare function describe(name: string, fn: () => void): void;
        declare function test(name: string, fn: () => void | Promise<void>): void;
        declare function it(name: string, fn: () => void | Promise<void>): void;
        declare function expect(actual: any): any;
        declare function beforeEach(fn: () => void | Promise<void>): void;
        declare function afterEach(fn: () => void | Promise<void>): void;
        declare function beforeAll(fn: () => void | Promise<void>): void;
        declare function afterAll(fn: () => void | Promise<void>): void;
      `,
      ts.ScriptTarget.ESNext,
      true
    );

    const compilerHost: ts.CompilerHost = {
      getSourceFile: (fileName) => {
        if (fileName === 'temp.ts') {
          return sourceFile;
        }
        if (fileName === 'lib.d.ts') {
          return libSource;
        }
        return undefined;
      },
      writeFile: () => {},
      getCurrentDirectory: () => '',
      getDirectories: () => [],
      fileExists: (fileName) => fileName === 'temp.ts' || fileName === 'lib.d.ts',
      readFile: () => '',
      getCanonicalFileName: (fileName) => fileName,
      useCaseSensitiveFileNames: () => true,
      getNewLine: () => '\n',
      getDefaultLibFileName: () => 'lib.d.ts',
    };

    const program = ts.createProgram(['temp.ts'], compilerOptions, compilerHost);
    const diagnostics = [
      ...program.getSyntacticDiagnostics(sourceFile),
      ...program.getSemanticDiagnostics(sourceFile),
    ];

    const filteredDiagnostics = diagnostics.filter((diagnostic) => {
      const moduleErrorCodes = [2307, 2792, 7016];
      return !moduleErrorCodes.includes(diagnostic.code);
    });

    filteredDiagnostics.forEach((diagnostic) => {
      if (diagnostic.file && diagnostic.start !== undefined) {
        const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');

        const validationError: ValidationError = {
          line: line + 1,
          column: character + 1,
          message,
          category: diagnostic.category === ts.DiagnosticCategory.Error ? 'error' : 
                   diagnostic.category === ts.DiagnosticCategory.Warning ? 'warning' : 'suggestion',
        };

        if (validationError.category === 'error') {
          errors.push(validationError);
        } else {
          warnings.push(validationError);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [{
        line: 1,
        column: 1,
        message: error instanceof Error ? error.message : 'Unknown validation error',
        category: 'error',
      }],
      warnings: [],
    };
  }
};

export const validateTestCode = (code: string): ValidationResult => {
  const result = validateTypeScriptCode(code);

  const additionalWarnings: ValidationError[] = [];

  if (!code.includes('test(') && !code.includes('it(') && !code.includes('describe(')) {
    additionalWarnings.push({
      line: 1,
      column: 1,
      message: 'No test function found. Expected test(), it(), or describe().',
      category: 'warning',
    });
  }

  if (!code.includes('expect(')) {
    additionalWarnings.push({
      line: 1,
      column: 1,
      message: 'No expect() assertions found in test code.',
      category: 'warning',
    });
  }

  if (code.includes('async') && !code.includes('await')) {
    additionalWarnings.push({
      line: 1,
      column: 1,
      message: 'Async test function declared but no await keyword found.',
      category: 'warning',
    });
  }

  return {
    ...result,
    warnings: [...result.warnings, ...additionalWarnings],
  };
};

export const formatValidationErrors = (errors: ValidationError[]): string => {
  if (errors.length === 0) return '';
  
  return errors
    .map((error) => `Line ${error.line}:${error.column} - ${error.message}`)
    .join('\n');
};

export const getValidationSummary = (result: ValidationResult): string => {
  const errorCount = result.errors.length;
  const warningCount = result.warnings.length;

  if (errorCount === 0 && warningCount === 0) {
    return '✓ No issues found';
  }

  const parts: string[] = [];
  if (errorCount > 0) {
    parts.push(`${errorCount} error${errorCount > 1 ? 's' : ''}`);
  }
  if (warningCount > 0) {
    parts.push(`${warningCount} warning${warningCount > 1 ? 's' : ''}`);
  }

  return parts.join(', ');
};
