/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testMatch: ['<rootDir>/test/**/*.spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        strictPropertyInitialization: false,
      },
    }],
  },
  moduleNameMapper: {
    '^@biblioflow/shared-errors$': '<rootDir>/../../packages/shared-errors/src/index.ts',
    '^@biblioflow/shared-types$': '<rootDir>/../../packages/shared-types/src/index.ts',
    '^@biblioflow/shared-events$': '<rootDir>/../../packages/shared-events/src/index.ts',
  },
  collectCoverageFrom: [
    'src/domain/entities/**/*.ts',
    'src/domain/value-objects/**/*.ts',
    'src/application/use-cases/**/*.ts',
    'src/application/mappers/**/*.ts',
    'src/presentation/controllers/**/*.ts',
    'src/presentation/filters/**/*.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
      branches: 30,
      statements: 80,
    },
  },
  testEnvironment: 'node',
};
