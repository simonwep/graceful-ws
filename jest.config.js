module.exports = {
    coverageDirectory: 'coverage',
    coverageReporters: ['text'],
    testEnvironment: 'node',
    collectCoverageFrom: [
        'src/**/*.ts'
    ],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest'
    }
};
