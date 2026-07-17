# Coding Standards

## TypeScript Configuration

Every project in the monorepo uses the following strict TypeScript configuration:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "exactOptionalPropertyTypes": true,
    "noUnusedLocals": "error",
    "noUnusedParameters": "error",
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noPropertyAccessFromIndexSignature": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@shared/*": ["../shared/*"]
    }
  }
}
```

## Code Quality Gates

| Gate | Tool | Threshold | Action |
|------|------|-----------|--------|
| TypeScript | tsc —noEmit | Zero errors | Blocking |
| Linting | ESLint strict | Zero errors/warnings | Blocking |
| Formatting | Prettier | Consistent style | Advisory |
| Complexity | ESLint complexity | < 10 per function | Blocking |
| File Size | ESLint max-lines | < 400 per file | Blocking |
| Function Size | Manual | < 40 lines | Blocking |
| Nesting | ESLint max-depth | < 4 levels | Blocking |
| Parameters | ESLint max-params | < 3 per function | Blocking |
| Test Coverage | Jest --coverage | 85% lines, 75% branches | Blocking |

## JavaScript/TypeScript Standards

### Prohibited Patterns

```typescript
// ❌ NEVER write these:
const x: any = someFunction();              // No 'any'
const y = result as any;                    // No type assertions
// @ts-ignore                                 // No ts-ignore
// @ts-expect-error                            // No ts-expect-error
const z = obj!.property;                     // No non-null assertions
console.log('debug');                        // No console.log in production
try { } catch (e) { }                        // No empty catch
if (x) doSomething();                        // No single-line ifs
const data = await Model.find();             // Always use .lean()
var name = 'test';                           // No var — use const/let
```

### Required Patterns

```typescript
// ✅ ALWAYS use these:
function processInput(input: unknown): string {
  if (typeof input === 'string') return input.trim();
  if (input instanceof Error) return input.message;
  throw new Error(`Unexpected input type: ${typeof input}`);
}

// Branded types for IDs
type Brand<K, T> = K & { __brand: T };
type OrderId = Brand<string, 'OrderId'>;

// Discriminated unions for state machines
type OrderState =
  | { status: 'pending' }
  | { status: 'confirmed'; confirmedAt: Date }
  | { status: 'preparing'; startedAt: Date }
  | { status: 'delivered'; deliveredAt: Date }
  | { status: 'cancelled'; reason: string };

// Exhaustive switch
function getStateText(state: OrderState): string {
  switch (state.status) {
    case 'pending': return 'Pending';
    case 'confirmed': return 'Confirmed';
    case 'preparing': return 'Preparing';
    case 'delivered': return 'Delivered';
    case 'cancelled': return `Cancelled: ${state.reason}`;
    default: {
      const _exhaustive: never = state;
      throw new Error(`Unhandled: ${_exhaustive}`);
    }
  }
}

// Early returns and guard clauses
function processOrder(order: IOrder): Result {
  if (!order) return { error: 'Order is required' };
  if (order.isDeleted) return { error: 'Order is deleted' };
  if (order.items.length === 0) return { error: 'Order has no items' };
  // Main logic here
}
```

## ESLint Configuration

```javascript
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/strict',
    'plugin:@typescript-eslint/stylistic',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    '@typescript-eslint/ban-ts-comment': 'error',
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-alert': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'complexity': ['error', 10],
    'max-depth': ['error', 4],
    'max-lines': ['error', 400],
    'max-params': ['error', 3],
    'max-statements': ['error', 30],
  },
};
```

## Import Order

```typescript
// 1. Node.js built-ins
import { readFile } from 'node:fs/promises';
import path from 'node:path';

// 2. Third-party packages
import express, { Router, Request, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';

// 3. Internal absolute imports
import { authMiddleware } from '@/middleware/auth.middleware';
import { OrderModel } from '@/domains/orders/order.model';

// 4. Relative imports (rare)
import { formatCurrency } from './utils';

// 5. Type imports (grouped separately)
import type { IOrder, IOrderDTO } from '@/domains/orders/order.types';
```

## Component Architecture (React Native)

```typescript
// 1. Imports (grouped: react → expo → external → internal)
import React, { useCallback } from 'react';
import { Pressable, Text, Image } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { formatCurrency } from '@/utils/format';

// 2. Props interface
export interface MenuItemCardProps {
  item: IMenuItem;
  onPress: (itemId: string) => void;
  variant?: 'grid' | 'list';
}

// 3. Supporting types (if needed)

// 4. Component function with hooks first
export const MenuItemCard: React.FC<MenuItemCardProps> = React.memo(({
  item,
  onPress,
  variant = 'list',
}) => {
  const theme = useTheme();
  const handlePress = useCallback(() => onPress(item._id), [item._id, onPress]);

  return (
    <Pressable onPress={handlePress} className="p-4 bg-white rounded-xl">
      <Image source={{ uri: item.image }} className="w-full h-32 rounded-lg" />
      <Text className="text-lg font-semibold mt-2">{item.name}</Text>
      <Text className="text-gray-500">{item.description}</Text>
      <Text className="text-primary-500 font-bold mt-1">{formatCurrency(item.price)}</Text>
    </Pressable>
  );
});

// 5. Named export (NO default exports)
```

## File Organization Rules

| Rule | Limit | Enforcement |
|------|-------|-------------|
| Max lines per file | 400 | ESLint |
| Max lines per function | 40 | Code review |
| Max nesting depth | 4 levels | ESLint |
| Max cyclomatic complexity | 10 | ESLint |
| Max parameters per function | 3 | ESLint |
| Max statements per function | 30 | ESLint |
| Max exports per file | 5 | Code review |
| Max imports per file | 20 | Code review |

## Comments and Documentation

- **JSDoc**: Required for all exported functions, classes, and interfaces
- **Inline comments**: Use to explain "why", not "what" (code should be self-documenting)
- **No commented-out code**: Delete it. Git history has it if needed
- **No TODO/FIXME/HACK**: Create a ticket instead
