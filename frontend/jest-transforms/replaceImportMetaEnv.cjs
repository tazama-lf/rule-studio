'use strict';
// ts-jest AST transformer – replaces `import.meta.env.X` with a string literal
// so that Vite-style env references compile cleanly in Jest's CommonJS mode.

const ts = require('typescript');

/** Values mirrored from jest.setup.ts global.importMeta.env */
const ENV_VALUES = {
    VITE_API_URL: 'http://localhost:3000',
    VITE_SANDBOX_API_URL: 'http://localhost:3001',
    VITE_NATS_API_URL: 'http://localhost:3002',
    VITE_DEMS_ENDPOINT: 'http://localhost:3003',
    VITE_ADMIN_ENDPOINT: 'http://localhost:3004',
    VITE_SIMULATION_ENDPOINT: 'http://localhost:3005',
    VITE_CRYPTO_KEY: 'test-crypto-key',
};

// Required by ts-jest: transformer metadata
exports.name = 'replaceImportMetaEnv';
exports.version = 1;

/**
 * ts-jest astTransformers.before factory.
 * (program: ts.Program, opts?: unknown) => ts.TransformerFactory<ts.SourceFile>
 */
exports.factory = function (_program) {
    return function (context) {
        return function (sourceFile) {
            function visitor(node) {
                // Match: import.meta.env.VITE_SOMETHING
                if (
                    ts.isPropertyAccessExpression(node) &&
                    ts.isPropertyAccessExpression(node.expression) &&
                    ts.isMetaProperty(node.expression.expression) &&
                    node.expression.expression.keywordToken === ts.SyntaxKind.ImportKeyword &&
                    String(node.expression.name.escapedText) === 'env'
                ) {
                    const key = String(node.name.escapedText);
                    const value = Object.prototype.hasOwnProperty.call(ENV_VALUES, key)
                        ? ENV_VALUES[key]
                        : '';
                    return ts.factory.createStringLiteral(value);
                }
                return ts.visitEachChild(node, visitor, context);
            }
            return ts.visitNode(sourceFile, visitor);
        };
    };
};
