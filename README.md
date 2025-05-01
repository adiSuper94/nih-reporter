# WIP: nih-reporter

A TypeScript/JavaScript wrapper to call NIH reporter API

## Installation

### Deno
```bash
deno add @jsr:@adisuper94/nih-reporter
```
### Node
```bash
npm install @adisuper94/nih-reporter
```

## Basic Usage
```typescript
import { NIHProjectQuery } from "@adisuper94/nih-reporter";

const nihPersonIds: number[] = [12345679, 12345678];
let query = new NIHProjectQuery();
query.setPIProfileIds(nihPersonIds).setLimit(100).setFiscalYears([2020, 2021, 2022, 2023, 2024, 2025]);
const iter = query.safeIterator();
for await (const [project, err] of iter) {
    if (err) {
    // Handle error
        console.error(err);
        continue;
    }
}
```
