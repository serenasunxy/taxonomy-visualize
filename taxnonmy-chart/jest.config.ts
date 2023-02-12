// eslint-disable-next-line @typescript-eslint/no-var-requires
const merge = require('lodash/merge');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const tsPreset = require('ts-jest/jest-preset');

module.exports = merge({}, tsPreset, {
    modulePaths: ['<rootDir>/src'],
    watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
    resetMocks: true,
    collectCoverageFrom: ['src/**/*.{ts,tsx,jsx,js}', '!src/main.tsx', '!src/**/*.d.ts', '!src/mock/**/*.{ts,js}'],
    testEnvironment: 'jsdom',
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
    setupFilesAfterEnv: ['<rootDir>/config/jest/jest-setup.ts'],
    moduleNameMapper: {
        '\\.(css|scss)$': 'identity-obj-proxy',
    },
});

export {};
