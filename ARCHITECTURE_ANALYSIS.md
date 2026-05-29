# InsightFacade Architecture Analysis

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER (Browser)                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                      React Frontend (Port 3001 dev)                     │ │
│  │  ┌────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │ │
│  │  │  AddDataset    │  │  ListDatasets   │  │  PerformQuery           │  │ │
│  │  │  Component     │  │  Component      │  │  Component              │  │ │
│  │  └────────┬───────┘  └────────┬────────┘  └────────┬────────────────┘  │ │
│  │           │                   │                     │                    │ │
│  │           └───────────────────┼─────────────────────┘                    │ │
│  │                               │                                          │ │
│  │                     ┌─────────▼──────────┐                               │ │
│  │                     │ InsightFacadeAPI   │  (Singleton)                  │ │
│  │                     │  - addDataset()    │                               │ │
│  │                     │  - removeDataset() │                               │ │
│  │                     │  - listDatasets()  │                               │ │
│  │                     │  - performQuery()  │                               │ │
│  │                     │  - generateInsights()                              │ │
│  │                     └─────────┬──────────┘                               │ │
│  └──────────────────────────────┼───────────────────────────────────────────┘ │
└────────────────────────────────┼─────────────────────────────────────────────┘
                                 │ HTTP Requests
                                 │ (JSON over REST)
                                 │
┌────────────────────────────────▼─────────────────────────────────────────────┐
│                          SERVER LAYER (Port 3000)                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    Express.js REST API Server                           │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │  │                    API Routes (RESTful)                           │  │ │
│  │  │  PUT    /api/v1/datasets/:id/:kind  - Add dataset                │  │ │
│  │  │  DELETE /api/v1/datasets/:id        - Remove dataset             │  │ │
│  │  │  GET    /api/v1/datasets            - List datasets              │  │ │
│  │  │  POST   /api/v1/queries             - Perform query              │  │ │
│  │  │  GET    /api/v1/insights/:id        - Generate insights          │  │ │
│  │  │  GET    /*                          - Serve React static files   │  │ │
│  │  └────────────────────────┬─────────────────────────────────────────┘  │ │
│  │                           │                                             │ │
│  │                  ┌────────▼──────────┐                                  │ │
│  │                  │  InsightFacade    │  ⚠️ SINGLETON INSTANCE           │ │
│  │                  │  (Business Logic) │                                  │ │
│  │                  └────────┬──────────┘                                  │ │
│  └──────────────────────────┼──────────────────────────────────────────────┘ │
└────────────────────────────┼─────────────────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────────────────┐
│                        BUSINESS LOGIC LAYER                                   │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         InsightFacade                                   │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │  │  Core Responsibilities:                                           │  │ │
│  │  │  - Dataset lifecycle (add, remove, list)                          │  │ │
│  │  │  - Query execution orchestration                                  │  │ │
│  │  │  - In-memory dataset cache (Map<string, Section[] | Room[]>)     │  │ │
│  │  │  - Dataset persistence coordination                               │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                          │ │
│  │  Dependencies (Composition):                                             │ │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐        │ │
│  │  │ QueryValidator  │  │ DatasetValidator │  │ QueryProcessor  │        │ │
│  │  │                 │  │                  │  │                 │        │ │
│  │  │ - Structure     │  │ - ID validation  │  │ - Grouping      │        │ │
│  │  │ - WHERE clause  │  │ - Zip parsing    │  │ - Aggregation   │        │ │
│  │  │ - TRANS rules   │  │ - Section extract│  │ - Sorting       │        │ │
│  │  │ - OPTIONS       │  │ - Room extract   │  │ - Filtering     │        │ │
│  │  └─────────────────┘  └────────┬─────────┘  └─────────────────┘        │ │
│  │                                 │                                        │ │
│  │                                 │ Uses                                   │ │
│  │                     ┌───────────▼─────────────┐                          │ │
│  │                     │  GeolocationService     │                          │ │
│  │                     │  - fetchCoordinates()   │                          │ │
│  │                     │  (External API calls)   │                          │ │
│  │                     └─────────────────────────┘                          │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        DatasetInsights                                  │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │  │  Analytics Engine:                                                │  │ │
│  │  │  - Top departments by enrollment                                 │  │ │
│  │  │  - Historical department averages                                │  │ │
│  │  │  - Top courses by enrollment per dept                            │  │ │
│  │  │  - Highest average courses per dept                              │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  │           Depends on ──────────▶ InsightFacade.performQuery()           │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼──────────────────────────────────────────┐
│                          DATA MODEL LAYER                                      │
│  ┌────────────────────┐          ┌────────────────────┐                       │
│  │     Section        │          │       Room         │                       │
│  │  - dept: string    │          │  - fullname: string│                       │
│  │  - id: string      │          │  - shortname: str  │                       │
│  │  - avg: number     │          │  - number: string  │                       │
│  │  - instructor: str │          │  - name: string    │                       │
│  │  - title: string   │          │  - address: string │                       │
│  │  - pass: number    │          │  - lat: number     │                       │
│  │  - fail: number    │          │  - lon: number     │                       │
│  │  - audit: number   │          │  - seats: number   │                       │
│  │  - uuid: string    │          │  - type: string    │                       │
│  │  - year: number    │          │  - furniture: str  │                       │
│  │                    │          │  - href: string    │                       │
│  └────────────────────┘          └────────────────────┘                       │
└───────────────────────────────────────────────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼──────────────────────────────────────────┐
│                        PERSISTENCE LAYER                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                      File System (fs-extra)                             │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │  │
│  │  │  ./data/                                                          │  │  │
│  │  │    ├── sections1.json    (PersistedDataset)                      │  │  │
│  │  │    ├── sections2.json    { id, kind, data: Section[] }           │  │  │
│  │  │    └── rooms1.json       { id, kind, data: Room[] }              │  │  │
│  │  └──────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                          │  │
│  │  Operations:                                                             │  │
│  │  - fs.ensureDir()     - Create data directory                           │  │
│  │  - fs.writeJSON()     - Persist dataset                                 │  │
│  │  - fs.readJSON()      - Load persisted dataset                          │  │
│  │  - fs.remove()        - Delete dataset file                             │  │
│  │  - fs.pathExists()    - Check if data directory exists                  │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼──────────────────────────────────────────┐
│                           EXTERNAL SERVICES                                    │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  Geolocation API (for Room coordinates)                                │  │
│  │  - External HTTP requests to fetch lat/lon for building addresses      │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────────┐
│                              TEST LAYER                                        │
│  ┌────────────────────────────┐    ┌──────────────────────────────────────┐  │
│  │  InsightFacade.spec.ts     │    │  Server.spec.ts                      │  │
│  │  (Unit Tests)              │    │  (Integration Tests)                 │  │
│  │                            │    │                                      │  │
│  │  - Direct InsightFacade    │    │  - HTTP → Express → InsightFacade   │  │
│  │    method calls            │    │  - Uses SuperTest                    │  │
│  │  - Tests business logic    │    │  - Tests full request/response      │  │
│  │  - Mock/stub file system   │    │  - Tests API contracts              │  │
│  └────────────────────────────┘    └──────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. **Client Layer**
- **React Components**: UI views for dataset management, querying, insights visualization
- **InsightFacadeAPI**: Client-side API wrapper (Singleton pattern)
- **Responsibility**: User interface and client-side state management

### 2. **Server Layer**
- **Express.js**: HTTP server handling REST API endpoints
- **Routes**: RESTful endpoints following REST conventions
- **Static File Serving**: Serves React production build
- **Responsibility**: HTTP request routing, response formatting, error handling

### 3. **Business Logic Layer**
- **InsightFacade**: Main orchestrator (Facade pattern)
  - In-memory dataset cache
  - Persistence coordination
  - Query execution orchestration
- **QueryValidator**: Input validation (Strategy pattern)
- **DatasetValidator**: Dataset validation and parsing
- **QueryProcessor**: Query transformations, aggregations, sorting
- **DatasetInsights**: Analytics generation (uses InsightFacade)
- **GeolocationService**: External API integration

### 4. **Data Model Layer**
- **Section**: Value object for course section data
- **Room**: Value object for campus room data

### 5. **Persistence Layer**
- **fs-extra**: File system operations
- **Storage Format**: JSON files per dataset

---

## Software Engineering Analysis

### 1. Design Patterns Used

#### ✅ **Facade Pattern**
- **Location**: `InsightFacade` class
- **Purpose**: Provides simplified interface to complex subsystem (validators, processors, persistence)
- **Strength**: Hides complexity of query processing, validation, and persistence
- **Analysis**: Well-implemented. Single entry point for all dataset/query operations.

#### ✅ **Strategy Pattern**
- **Location**: `QueryValidator`, `DatasetValidator`, `QueryProcessor`
- **Purpose**: Encapsulates different validation/processing algorithms
- **Strength**: Each validator/processor is interchangeable and testable in isolation
- **Analysis**: Good separation of concerns. Each class has single responsibility.

#### ✅ **Singleton Pattern**
- **Location**:
  - `const insightFacade = new InsightFacade()` in server.ts
  - `export const api = new InsightFacadeAPI()` in frontend
- **Strength**: Ensures single source of truth for datasets
- **Weakness**: ⚠️ **CRITICAL ISSUE** - Singleton in server.ts causes state persistence across HTTP requests, breaking test isolation

#### ✅ **Repository Pattern (Implicit)**
- **Location**: InsightFacade persistence methods
- **Purpose**: Abstracts data access layer
- **Strength**: Clear separation between business logic and persistence
- **Weakness**: No explicit interface, tightly coupled to fs-extra

#### ✅ **Value Object Pattern**
- **Location**: `Section`, `Room` classes
- **Purpose**: Immutable data containers
- **Strength**: Type-safe data representation
- **Analysis**: Simple, effective data modeling

---

### 2. SOLID Principles Analysis

#### **Single Responsibility Principle (SRP)** ✅ STRONG
- ✅ `QueryValidator`: Only validates query structure
- ✅ `QueryProcessor`: Only processes queries (grouping, aggregation, sorting)
- ✅ `DatasetValidator`: Only validates datasets
- ✅ `DatasetInsights`: Only generates analytics
- ⚠️ `InsightFacade`: Slightly bloated - handles dataset lifecycle, query execution, AND persistence coordination (could be split)

**Score: 8/10** - Very good, minor violation in InsightFacade

#### **Open/Closed Principle (OCP)** ⚠️ MODERATE
- ✅ Query operations (LT, GT, EQ, IS, AND, OR, NOT) use switch statements - could be more extensible
- ❌ Adding new dataset kinds requires modifying multiple files
- ❌ Adding new aggregation operations requires modifying QueryProcessor switch statement

**Score: 5/10** - Functional but not easily extensible

**Improvement**: Use polymorphic filter classes instead of switch statements:
```typescript
interface Filter {
  evaluate(item: Section | Room): boolean;
}
class LessThanFilter implements Filter { ... }
class GreaterThanFilter implements Filter { ... }
```

#### **Liskov Substitution Principle (LSP)** ✅ STRONG
- ✅ `Section` and `Room` are used interchangeably as `Section | Room`
- ✅ No inheritance hierarchies that violate LSP

**Score: 9/10** - Excellent adherence

#### **Interface Segregation Principle (ISP)** ✅ STRONG
- ✅ `IInsightFacade` defines clear contract
- ✅ No fat interfaces forcing unnecessary implementations
- ✅ Each component has minimal, focused interface

**Score: 9/10** - Well-designed interfaces

#### **Dependency Inversion Principle (DIP)** ⚠️ WEAK
- ❌ InsightFacade depends directly on concrete classes (QueryValidator, DatasetValidator, QueryProcessor)
- ❌ Server depends directly on concrete InsightFacade class
- ❌ No dependency injection - all dependencies hardcoded
- ❌ Tightly coupled to fs-extra implementation

**Score: 3/10** - Major violation

**Improvement**: Inject dependencies via constructor:
```typescript
class InsightFacade {
  constructor(
    private validator: IQueryValidator,
    private processor: IQueryProcessor,
    private persistence: IPersistenceService
  ) {}
}
```

---

### 3. Code Smells Identified

#### 🔴 **CRITICAL: Singleton Anti-Pattern in Server**
- **Location**: `server/server.ts:17`
- **Code**: `const insightFacade = new InsightFacade();`
- **Issue**: Single instance persists state across all HTTP requests
- **Impact**:
  - ❌ Test isolation broken (state leaks between tests)
  - ❌ Concurrent request issues in production
  - ❌ Cannot reset state without server restart
- **Fix**: Create new instance per request OR implement proper state reset mechanism

#### 🟡 **MODERATE: Feature Envy**
- **Location**: `DatasetInsights` class
- **Issue**: Calls `facade.performQuery()` repeatedly with complex queries
- **Impact**: DatasetInsights knows too much about query structure
- **Fix**: InsightFacade should expose higher-level analytics methods

#### 🟡 **MODERATE: Long Parameter Lists**
- **Location**: `QueryProcessor.applyAggregations()`
- **Issue**: Takes 3 parameters (groups, applyRules, groupKeys)
- **Fix**: Encapsulate parameters in TransformationContext object

#### 🟡 **MODERATE: Magic Numbers**
- **Location**: Throughout codebase
  - `InsightFacade.MAX_RESULTS = 5000`
  - `DatasetInsights.TOP_DEPARTMENTS_COUNT = 3`
  - `JSON_EXTENSION_LENGTH = 5`
- **Strength**: At least they're constants, not literals
- **Improvement**: Could be configuration file

#### 🟢 **MINOR: Duplicate Code**
- **Location**: QueryValidator validation methods
- **Issue**: Similar structure for validateMComparison() and validateSComparison()
- **Impact**: Low - clear separation is good for readability

#### 🟢 **MINOR: Comments as Code Smell**
- **Location**: Multiple "Code generated by AI" comments
- **Issue**: Good for attribution, but suggests possible lack of understanding
- **Recommendation**: Ensure team understands AI-generated code

---

### 4. Coupling & Cohesion Analysis

#### **Coupling Analysis**

| Component Pair | Coupling Type | Level | Analysis |
|----------------|---------------|-------|----------|
| Server → InsightFacade | Tight | 🔴 HIGH | Direct instantiation, no interface |
| InsightFacade → Validators | Tight | 🔴 HIGH | Concrete class dependencies |
| InsightFacade → fs-extra | Tight | 🔴 HIGH | Direct file system dependency |
| DatasetInsights → InsightFacade | Medium | 🟡 MODERATE | Depends on performQuery() method |
| React Components → API | Loose | 🟢 LOW | Uses API class abstraction |
| QueryProcessor → Data Models | Loose | 🟢 LOW | Uses generic Section | Room union |

**Overall Coupling Score: 5/10** - Too much tight coupling in core components

**Recommendations**:
1. Introduce interfaces for all validators and processors
2. Use dependency injection throughout
3. Abstract file system behind IPersistenceService interface
4. Make server create InsightFacade per request or use factory

#### **Cohesion Analysis**

| Component | Cohesion Type | Level | Analysis |
|-----------|---------------|-------|----------|
| QueryValidator | Functional | 🟢 HIGH | All methods validate queries |
| QueryProcessor | Functional | 🟢 HIGH | All methods process queries |
| DatasetValidator | Functional | 🟢 HIGH | All methods validate datasets |
| InsightFacade | Sequential | 🟡 MODERATE | Multiple responsibilities (lifecycle, query, persist) |
| DatasetInsights | Functional | 🟢 HIGH | All methods generate insights |
| Section / Room | Logical | 🟢 HIGH | Data containers for related fields |

**Overall Cohesion Score: 8/10** - Strong cohesion throughout

**Strength**: Each class has clear, focused responsibility

---

### 5. Testability Analysis

#### **Unit Testability**

| Component | Testability | Score | Issues |
|-----------|-------------|-------|--------|
| QueryValidator | Excellent | 🟢 9/10 | Pure functions, no dependencies |
| QueryProcessor | Excellent | 🟢 9/10 | Pure functions, deterministic |
| DatasetValidator | Good | 🟡 7/10 | Depends on fs-extra, geolocation API |
| InsightFacade | Poor | 🔴 4/10 | Too many dependencies, no DI, tight coupling |
| DatasetInsights | Moderate | 🟡 6/10 | Depends on InsightFacade (hard to mock) |
| Server Routes | Poor | 🔴 3/10 | Singleton dependency, hard to isolate |

#### **Integration Testability**

| Layer | Testability | Score | Issues |
|-------|-------------|-------|--------|
| REST API | Moderate | 🟡 6/10 | ⚠️ Singleton state persists between tests |
| Business Logic | Good | 🟢 8/10 | Can test InsightFacade directly |
| Persistence | Good | 🟢 8/10 | Can clear ./data directory |

#### **Current Test Issues**

1. **Server.spec.ts Failures** 🔴
   - Root cause: Singleton InsightFacade keeps state between tests
   - Impact: 10 tests failing due to state leakage
   - Fix: Either create new InsightFacade per request OR call a reset() method before each test

2. **Test Isolation** 🔴
   - `clearDisk()` clears files but NOT in-memory state
   - Tests are NOT independent
   - Violates test isolation principle

3. **Mock Difficulty** 🟡
   - Cannot easily mock fs-extra (direct dependency)
   - Cannot mock validators (concrete dependencies)
   - Geolocation API calls during tests (should be mocked)

#### **Testability Improvements**

```typescript
// BEFORE (current - not testable)
class InsightFacade {
  private queryValidator = new QueryValidator();
  private datasets = new Map<string, Section[] | Room[]>();
  // ... hardcoded dependencies
}

// AFTER (testable)
interface IQueryValidator { ... }
interface IPersistenceService { ... }

class InsightFacade {
  constructor(
    private validator: IQueryValidator = new QueryValidator(),
    private persistence: IPersistenceService = new FileSystemPersistence(),
    private processor: IQueryProcessor = new QueryProcessor()
  ) {}

  // Add reset method for testing
  public resetForTesting(): void {
    this.datasets.clear();
    this.datasetKinds.clear();
  }
}

// In server.ts
app.use((req, res, next) => {
  req.insightFacade = new InsightFacade(); // New instance per request
  next();
});
```

---

## Summary: High-Level Strengths

### ✅ **Strengths**

1. **Clear Layered Architecture**
   - Well-defined separation: Client → Server → Business Logic → Data → Persistence
   - Clean REST API design
   - Good use of React component composition

2. **Strong Cohesion**
   - Each class has focused responsibility
   - QueryValidator, QueryProcessor, DatasetValidator are textbook examples of SRP

3. **Good Design Patterns**
   - Facade pattern simplifies complex subsystem
   - Strategy pattern for validators/processors
   - Value objects for data modeling

4. **Type Safety**
   - Full TypeScript usage
   - Interfaces for contracts (IInsightFacade)
   - Strong typing throughout

5. **Comprehensive Validation**
   - Input validation at API boundary
   - Business logic validation in QueryValidator
   - Prevents invalid states

6. **Async/Await Consistency**
   - Proper promise handling throughout
   - Clean async code

---

## Summary: High-Level Weaknesses

### ❌ **Critical Weaknesses**

1. **🔴 SINGLETON STATE MANAGEMENT** (Severity: CRITICAL)
   - **Issue**: Server creates single InsightFacade instance shared across all requests
   - **Impact**:
     - State leaks between HTTP requests
     - Tests fail due to state persistence
     - Race conditions in concurrent requests
     - Cannot isolate failures
   - **Fix Priority**: IMMEDIATE
   - **Recommendation**: Create InsightFacade per request OR add reset() method

2. **🔴 TIGHT COUPLING** (Severity: HIGH)
   - **Issue**: Direct concrete class dependencies throughout
   - **Impact**:
     - Difficult to test (cannot mock dependencies)
     - Cannot swap implementations
     - Violates Dependency Inversion Principle
   - **Fix Priority**: HIGH
   - **Recommendation**: Introduce interfaces + dependency injection

3. **🔴 NO DEPENDENCY INJECTION** (Severity: HIGH)
   - **Issue**: All dependencies hardcoded in constructors
   - **Impact**:
     - Poor testability
     - Cannot use test doubles
     - Tightly coupled to implementations
   - **Fix Priority**: HIGH
   - **Recommendation**: Use constructor injection with default values

### 🟡 **Moderate Weaknesses**

4. **🟡 LIMITED EXTENSIBILITY** (Severity: MODERATE)
   - **Issue**: Switch statements for operations, hardcoded dataset kinds
   - **Impact**: Adding new features requires modifying existing code (violates OCP)
   - **Fix Priority**: MODERATE
   - **Recommendation**: Use polymorphism (Command pattern for filters/aggregations)

5. **🟡 POOR TEST ISOLATION** (Severity: MODERATE)
   - **Issue**: Tests share state via singleton, clearDisk() insufficient
   - **Impact**: Test failures cascade, unreliable test suite
   - **Fix Priority**: MODERATE (blocked by fix #1)
   - **Recommendation**: Ensure each test starts with clean state

6. **🟡 FILE SYSTEM COUPLING** (Severity: MODERATE)
   - **Issue**: Direct fs-extra usage in business logic
   - **Impact**: Cannot test without file system, slow tests
   - **Fix Priority**: MODERATE
   - **Recommendation**: Abstract behind IPersistenceService interface

### 🟢 **Minor Weaknesses**

7. **🟢 FEATURE ENVY** (Severity: LOW)
   - **Issue**: DatasetInsights knows too much about query structure
   - **Impact**: Coupling between insights and query format
   - **Fix Priority**: LOW
   - **Recommendation**: Add higher-level analytics methods to InsightFacade

8. **🟢 MAGIC NUMBERS** (Severity: LOW)
   - **Issue**: Constants like MAX_RESULTS, TOP_DEPARTMENTS_COUNT hardcoded
   - **Impact**: Cannot configure without code changes
   - **Fix Priority**: LOW
   - **Recommendation**: Move to configuration file

---

## Testability Score: 5.5/10

**Breakdown**:
- Unit test support: 7/10 (validators/processors are testable)
- Integration test support: 4/10 (singleton breaks isolation)
- Mockability: 3/10 (tight coupling, no DI)
- Test isolation: 2/10 (state persists between tests)

**Primary Blocker**: Singleton InsightFacade in server.ts

---

## Overall Architecture Score: 6.5/10

**Justification**:
- ✅ Strong layering, cohesion, and clear responsibilities (+3)
- ✅ Good use of design patterns and TypeScript (+2)
- ✅ Comprehensive validation and error handling (+1.5)
- ❌ Critical singleton state management issue (-2)
- ❌ Tight coupling and no dependency injection (-1.5)
- ❌ Poor testability due to architectural choices (-1.5)

**Verdict**: Solid foundation with clean architecture, but critical flaws in state management and dependency injection severely impact production readiness and testability. The singleton issue must be fixed immediately for reliable testing and production deployment.

---

## Recommended Priority Fixes

### Priority 1 (IMMEDIATE - BLOCKING TESTS)
1. Fix singleton state management in server.ts
   - Option A: Create new InsightFacade per request
   - Option B: Add `reset()` method and call before each test
   - Option C: Use request-scoped middleware

### Priority 2 (HIGH - IMPROVES TESTABILITY)
2. Introduce dependency injection
   - Create interfaces for validators, processors
   - Use constructor injection with default values
   - Abstract file system behind IPersistenceService

### Priority 3 (MODERATE - IMPROVES MAINTAINABILITY)
3. Improve extensibility
   - Replace switch statements with polymorphic classes
   - Use Command pattern for query operations
   - Use Strategy pattern for aggregations

### Priority 4 (LOW - NICE TO HAVE)
4. Extract configuration
   - Move magic numbers to config file
   - Support runtime configuration
   - Environment-based settings
