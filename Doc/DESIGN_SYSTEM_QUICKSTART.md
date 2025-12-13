# Design System Quick Start

**Quick reference for using the MoveAccess Design System**

## 📦 Import Components

```tsx
// Import individual components
import { Button, Input, Card, Badge } from "@/components/ui";

// Import layouts
import { MarketingLayout, AuthLayout, AppLayout } from "@/components/layouts";
```

## 🎨 Common Patterns

### Button Usage

```tsx
// Primary action
<Button variant="default" size="lg">Save Changes</Button>

// Hero button (for landing pages)
<Button variant="hero" size="lg">Get Started</Button>

// Secondary action
<Button variant="outline">Cancel</Button>

// Destructive action
<Button variant="destructive">Delete</Button>
```

### Typography

```tsx
// Headings
<Heading level="h1" gradient>Main Title</Heading>
<Heading level="h2">Section Title</Heading>

// Text
<Text size="lg" color="muted">Description text</Text>
<Text weight="semibold">Important info</Text>
```

### Cards

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Subtitle or description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Content goes here</p>
  </CardContent>
</Card>
```

### Forms

```tsx
<form className="space-y-4">
  <div>
    <Text as="label" weight="medium" className="mb-2 block">
      Email
    </Text>
    <Input type="email" placeholder="seu@email.com" />
  </div>
  <Button type="submit">Submit</Button>
</form>
```

### Layout Structure

```tsx
// Marketing page
export default function Page() {
  return (
    <MarketingLayout>
      <Section spacing="large">
        <Container size="wide">
          {/* Content */}
        </Container>
      </Section>
    </MarketingLayout>
  );
}

// Auth page
export default function LoginPage() {
  return (
    <AuthLayout>
      <Card>{/* Login form */}</Card>
    </AuthLayout>
  );
}

// App page
export default function DashboardPage() {
  return (
    <AppLayout>
      <Heading level="h2">Dashboard</Heading>
      {/* Content */}
    </AppLayout>
  );
}
```

## 🎨 Utility Classes

```tsx
// Gradients
<div className="bg-gradient-primary">Orange gradient background</div>
<h1 className="text-gradient">Gradient text</h1>

// Glass morphism
<div className="glass">Frosted glass effect</div>

// Shadows
<div className="shadow-glow">Glowing shadow</div>
<div className="shadow-card">Card shadow</div>

// Containers
<div className="container-wide">Max-width 7xl centered</div>
<div className="container-narrow">Max-width 6xl centered</div>
<div className="section-padding">Standard section padding</div>
```

## 🎯 Color Reference

```tsx
// Text colors
text-foreground      // Main text (white)
text-muted-foreground // Secondary text (gray)
text-primary         // Brand orange

// Background colors
bg-background        // Main background (dark)
bg-card              // Card background (slightly lighter)
bg-secondary         // Secondary background
bg-muted             // Muted background

// Border colors
border-border        // Standard border
```

## 📚 Full Documentation

See `Doc/DesignSystem.md` for complete documentation.

## 🎮 Demo Page

Visit `/design-system-demo` to see all components in action.

---

**Remember:**
- ✅ Use Design System components
- ✅ Customize via props and className
- ✅ Follow existing patterns
- ❌ Don't create custom styles outside the system
- ❌ Don't add business logic to UI components
