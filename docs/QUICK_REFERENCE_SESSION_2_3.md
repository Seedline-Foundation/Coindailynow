# 🚀 Quick Reference - Sessions 2 & 3

## 📦 New Components Imports

```tsx
// Loading Components
import {
  LoadingSpinner,
  LoadingDots,
  LoadingBar,
  LoadingSkeleton,
  LoadingOverlay,
  LoadingPage,
  ArticleCardSkeleton,
  DashboardCardSkeleton,
} from '@/components/ui/Loading';

// Animation Components
import {
  FadeIn,
  SlideIn,
  ScaleIn,
  IntersectionAnimate,
  StaggerChildren,
  Collapsible,
  Pulse,
  Bounce,
  Shake,
} from '@/components/ui/Animations';

// Error & Feedback Components
import {
  Alert,
  ErrorMessage,
  ValidationErrors,
  ErrorBoundaryFallback,
  EmptyState,
  Toast,
  useToast,
  getErrorMessage,
  errorMessages,
} from '@/components/ui/Errors';
```

## 🎨 Quick Usage Examples

### Loading Spinner
```tsx
<LoadingSpinner size="lg" color="primary" />
```

### Skeleton Loading
```tsx
<LoadingSkeleton variant="text" lines={3} />
<LoadingSkeleton variant="card" height={200} />
<ArticleCardSkeleton />
```

### Fade In Animation
```tsx
<FadeIn delay={200}>
  <YourComponent />
</FadeIn>
```

### Staggered Children
```tsx
<StaggerChildren staggerDelay={100}>
  {items.map(item => <ItemCard key={item.id} {...item} />)}
</StaggerChildren>
```

### Alert Message
```tsx
<Alert 
  variant="success" 
  title="Success!" 
  message="Operation completed" 
  closable 
/>
```

### Error with Retry
```tsx
<ErrorMessage 
  error={error}
  title="Failed to load"
  retry={() => refetch()}
/>
```

### Toast Notification
```tsx
const { showToast } = useToast();

showToast({
  variant: 'success',
  message: 'Saved successfully!',
  duration: 5000,
});
```

## 🧪 Testing Commands

```bash
# Unit Tests
npm run test:unit
npm run test:unit:coverage

# Integration Tests
npm run test:integration

# E2E Tests
npm run test:e2e
npm run test:e2e:ui          # With UI
npm run test:e2e:debug       # Debug mode
npm run test:e2e:critical    # Critical paths only

# Responsive Testing
npm run test:responsive

# Accessibility Testing
npm run test:accessibility

# Cross-Browser Testing
npm run test:browsers

# Performance Testing
npm run lighthouse
npm run lighthouse:ci

# All Tests
npm run test:all
```

## ✅ Validation Commands

```bash
# Type Checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Full Validation
npm run validate:production

# Production Build
npm run build:production

# Production Checklist
npm run checklist
npm run checklist:critical
```

## 📊 Component Props Reference

### LoadingSpinner
```tsx
interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
}
```

### Alert
```tsx
interface AlertProps {
  variant: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
  closable?: boolean;
  actions?: React.ReactNode;
  className?: string;
}
```

### FadeIn
```tsx
interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}
```

### IntersectionAnimate
```tsx
interface IntersectionAnimateProps {
  children: React.ReactNode;
  animation?: 'fadeIn' | 'slideIn' | 'scaleIn';
  direction?: 'left' | 'right' | 'top' | 'bottom';
  threshold?: number;
  rootMargin?: string;
  className?: string;
}
```

## 🎯 Success Metrics Targets

| Metric | Target |
|--------|--------|
| **Performance Score** | >90 |
| **Accessibility Score** | >90 |
| **Best Practices Score** | >90 |
| **SEO Score** | >90 |
| **Test Coverage** | >80% |
| **FCP** | <2s |
| **LCP** | <2.5s |
| **TTI** | <3.5s |
| **CLS** | <0.1 |
| **TBT** | <300ms |

## 📁 Key Files

```
frontend/
├── src/components/ui/
│   ├── Loading.tsx           # Loading components
│   ├── Animations.tsx        # Animation components
│   └── Errors.tsx            # Error components
├── tests/
│   ├── responsive.test.ts    # Responsive tests
│   ├── accessibility.test.ts # A11y tests
│   └── e2e/
│       └── critical-paths.spec.ts  # E2E tests
├── playwright.config.ts      # Browser test config
├── lighthouserc.js          # Lighthouse config
└── production-checklist.ts  # Production checklist
```

## 🔧 Common Patterns

### Loading State Pattern
```tsx
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} retry={refetch} />;
if (!data) return <EmptyState title="No data" />;
return <YourComponent data={data} />;
```

### Animation Pattern
```tsx
<IntersectionAnimate animation="fadeIn">
  <div className="card">
    <FadeIn delay={100}>
      <h3>Title</h3>
    </FadeIn>
    <SlideIn direction="bottom" delay={200}>
      <p>Content</p>
    </SlideIn>
  </div>
</IntersectionAnimate>
```

### Toast Pattern
```tsx
const { showToast } = useToast();

try {
  await action();
  showToast({ variant: 'success', message: 'Success!' });
} catch (error) {
  showToast({ variant: 'error', message: getErrorMessage(error) });
}
```

## 📚 Documentation

- **Complete Guide:** `docs/PHASE6.5_UI_POLISH_TESTING_COMPLETION.md`
- **Summary:** `docs/PHASE6.5_SESSION_2_3_SUMMARY.md`
- **Examples:** `src/pages/ui-examples.tsx`
- **Demo Script:** `scripts/demo-completion.js`

## 🎉 Status

✅ **COMPLETE** - Ready for production validation

**Next Steps:**
1. Run `npm run validate:production`
2. Review checklist: `npm run checklist`
3. Integrate components into pages
4. Address any validation issues
5. Deploy to staging

---

**Version:** 1.0  
**Date:** October 7, 2025  
**Quick Reference** - For full details see main documentation
