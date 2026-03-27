# React Query Migration Guide

This document explains how to migrate components from JSON imports to React Query hooks.

## Setup Complete ✅

The following has been set up:
- ✅ QueryClientProvider in `App.tsx`
- ✅ API service functions in `src/services/api.ts`
- ✅ Custom hooks in `src/hooks/useSDSRecords.ts` and `src/hooks/useExtenderRecords.ts`
- ✅ Header component migrated as example

## Migration Pattern

### Before (Using JSON):
```typescript
import sdsRecordsData from '../../data/sdsRecords.json';

const [sdsRecords, setSdsRecords] = useState<SDSRecord[]>([]);

useEffect(() => {
  const savedRecords = localStorage.getItem('sdsRecords');
  let records = savedRecords ? JSON.parse(savedRecords) : sdsRecordsData;
  setSdsRecords(records);
}, []);
```

### After (Using React Query):
```typescript
import { useSDSRecords } from '../../hooks/useSDSRecords';

const { data: sdsRecords = [], isLoading, error } = useSDSRecords();
```

## Components to Update

### 1. Dashboard (`src/pages/Dashboard/Dashboard.tsx`)
**Current:** Imports both `sdsRecordsData` and `extenderRecordsData`

**Update to:**
```typescript
import { useSDSRecords } from '../../hooks/useSDSRecords';
import { useExtenderRecords } from '../../hooks/useExtenderRecords';

// Replace useState and useEffect with:
const { data: sdsRecords = [], isLoading: isLoadingSDS } = useSDSRecords();
const { data: extenderRecords = [], isLoading: isLoadingExtenders } = useExtenderRecords();
```

### 2. Analytics (`src/pages/Analytics/Analytics.tsx`)
**Current:** Imports both JSON files and uses localStorage

**Update to:**
```typescript
import { useSDSRecords } from '../../hooks/useSDSRecords';
import { useExtenderRecords } from '../../hooks/useExtenderRecords';

const { data: sdsRecords = [] } = useSDSRecords();
const { data: extenderRecords = [] } = useExtenderRecords();
```

### 3. RawMaterialsGHS (`src/pages/RawMaterialsGHS/RawMaterials.tsx`)
**Current:** Imports `sdsRecordsData`

**Update to:**
```typescript
import { useSDSRecords } from '../../hooks/useSDSRecords';

const { data: sdsRecords = [], isLoading } = useSDSRecords();
```

### 4. RawMaterialsDG (`src/pages/RawMaterialsDG/RawMaterials.tsx`)
**Current:** Imports `sdsRecordsData`

**Update to:**
```typescript
import { useSDSRecords } from '../../hooks/useSDSRecords';

const { data: sdsRecords = [], isLoading } = useSDSRecords();
```

### 5. Extenders (`src/pages/Extenders/Extenders.tsx`)
**Current:** Imports `extenderRecordsData`

**Update to:**
```typescript
import { useExtenderRecords } from '../../hooks/useExtenderRecords';

const { data: extenderRecords = [], isLoading } = useExtenderRecords();
```

## Handling Loading States

React Query provides loading states automatically:

```typescript
const { data, isLoading, isError, error } = useSDSRecords();

if (isLoading) {
  return <div>Loading...</div>;
}

if (isError) {
  return <div>Error: {error.message}</div>;
}

// Use data safely with default empty array
const records = data || [];
```

## Updating Records (Mutations)

For approvals/rejections, use the mutation hooks:

```typescript
import { useUpdateSDSRecord } from '../../hooks/useSDSRecords';

const updateMutation = useUpdateSDSRecord();

const handleApprove = async (id: number) => {
  await updateMutation.mutateAsync({
    id,
    updates: {
      GHSStatus: 'Approved',
      'GHS Approval/Rejection Date': new Date().toISOString().split('T')[0],
    },
  });
};
```

## API Configuration

Update the API base URL in `src/services/api.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
```

Or create a `.env` file:
```
VITE_API_BASE_URL=http://your-api-url.com/api
```

## Benefits

1. **Automatic Caching**: Data is cached and shared across components
2. **Background Refetching**: Data stays fresh automatically
3. **Request Deduplication**: Multiple components requesting the same data share one request
4. **Loading States**: Built-in loading and error states
5. **Optimistic Updates**: Easy to implement for better UX

## Next Steps

1. Update each component following the pattern above
2. Remove JSON imports once all components are migrated
3. Update API endpoints in `src/services/api.ts` when backend is ready
4. Test with actual API endpoints


