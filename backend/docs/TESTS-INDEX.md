# Backend Tests Index

This index summarizes all backend test files added/updated, their purpose, and how to run them.

## Structure

```
DevOps/backend/
├─ controllers/
│  ├─ nursing.controller.test.js
│  ├─ nursingRegistration.controller.test.js
│  └─ authController.test.js
├─ models/
│  ├─ nursing.model.test.js
│  ├─ nursingRegistration.model.test.js
│  ├─ userModel.test.js
│  └─ clientauth.model.test.js
├─ middleware/
│  ├─ auth.test.js
│  └─ validation.test.js
├─ routes/
│  ├─ nursing.routes.test.js
│  └─ auth.test.js
├─ services/
│  └─ RedisService.test.js
├─ config/
│  ├─ db.test.js
│  └─ redis.test.js
├─ tests/
│  ├─ nursing.integration.test.js
│  ├─ auth.integration.test.js
│  ├─ redis.integration.test.js
│  ├─ redis.performance.test.js
│  ├─ redis.resilience.test.js
│  └─ setup.js
└─ jest.config.js
```

## Coverage
- Controllers, Models, Middleware, Routes: behavior and edge cases
- Config: MySQL pool and Redis client init, errors, envs
- Redis: unit, integration, performance, and resilience

## How to run

```bash
# All tests
npm test

# Coverage
npm run test:coverage

# Single file
npm test DevOps/backend/models/nursing.model.test.js
```

## Notes
- Tests mock external services where appropriate
- Integration tests use real Express routes and DB pool
- Performance benchmarks are informational and may vary by machine
