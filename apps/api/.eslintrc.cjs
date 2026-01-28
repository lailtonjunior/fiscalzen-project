/** @type {Object} */
module.exports = {
    extends: ['../../.eslintrc.cjs'],
    parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
    },
    env: {
        node: true,
        es2022: true,
    },
    rules: {
        'no-console': 'off',
        '@typescript-eslint/no-this-alias': 'off',
        '@typescript-eslint/no-require-imports': 'off',
    },
};
