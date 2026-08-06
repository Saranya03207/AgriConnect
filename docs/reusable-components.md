# AgriConnect – Reusable React Components

## Component Library Philosophy
- Built on top of Shadcn UI primitives
- Tailwind CSS for styling
- TypeScript strict props
- Accessible (ARIA attributes, keyboard navigation)
- Consistent naming: PascalCase, feature-prefixed where needed

---

## Layout Components

| Component          | Description                                              |
|--------------------|----------------------------------------------------------|
| `AppShell`         | Root layout wrapper with sidebar + topbar                |
| `Sidebar`          | Role-aware collapsible navigation sidebar                |
| `Topbar`           | Top navigation bar with user menu, notifications bell    |
| `PageHeader`       | Page title, breadcrumb, and optional action button       |
| `SectionCard`      | Card container for grouped content sections              |
| `EmptyState`       | Illustration + message for empty data states             |
| `PageLoader`       | Full-page centered spinner for route loading             |

---

## Data Display Components

| Component          | Description                                              |
|--------------------|----------------------------------------------------------|
| `DataTable`        | Sortable, paginated table with column config prop        |
| `StatsCard`        | Dashboard metric card (icon, value, label, trend)        |
| `ListingCard`      | Marketplace listing preview card                         |
| `ListingGrid`      | Responsive grid of ListingCards                          |
| `UserAvatar`       | Avatar with fallback initials, size variants             |
| `RatingStars`      | Read-only or interactive star rating (1–5)               |
| `StatusBadge`      | Color-coded badge for entity status                      |
| `PriceTag`         | Formatted price with currency and unit                   |
| `CategoryBadge`    | Colored tag for listing category                         |
| `TimeAgo`          | Human-readable relative timestamp                        |
| `ImageGallery`     | Multi-image viewer with thumbnail strip                  |
| `MapView`          | Amazon Location Service map embed component              |

---

## Form Components

| Component          | Description                                              |
|--------------------|----------------------------------------------------------|
| `FormField`        | Wrapper with label, input, error message (react-hook-form compatible) |
| `TextInput`        | Controlled text input with validation                    |
| `TextareaInput`    | Multi-line text input                                    |
| `SelectInput`      | Dropdown select with option config                       |
| `MultiSelect`      | Chips-style multi-value select                           |
| `NumberInput`      | Numeric input with min/max/step                          |
| `DatePicker`       | Date selection input                                     |
| `FileUpload`       | Drag-and-drop file upload with preview                   |
| `ImageUploader`    | Multi-image upload with reorder and preview              |
| `LocationPicker`   | Map-based location selector (Amazon Location Service)    |
| `PriceInput`       | Currency + amount combined input                         |
| `SearchBar`        | Search input with debounce and suggestions               |
| `FilterPanel`      | Collapsible filter form for marketplace                  |

---

## Feedback Components

| Component          | Description                                              |
|--------------------|----------------------------------------------------------|
| `Toast`            | Notification toast (success, error, warning, info)       |
| `AlertBanner`      | Inline alert bar for page-level messages                 |
| `ConfirmDialog`    | Modal for destructive action confirmation                |
| `LoadingSpinner`   | Inline spinner with optional label                       |
| `SkeletonCard`     | Skeleton placeholder for ListingCard                     |
| `SkeletonTable`    | Skeleton placeholder for DataTable                       |
| `ErrorBoundary`    | React error boundary with fallback UI                    |
| `InlineError`      | Small inline error message for form fields               |

---

## Navigation Components

| Component          | Description                                              |
|--------------------|----------------------------------------------------------|
| `Breadcrumb`       | Dynamic breadcrumb trail                                 |
| `TabNav`           | Horizontal tab navigation                                |
| `StepIndicator`    | Multi-step form progress indicator                       |
| `Pagination`       | Page controls for paginated data                         |
| `BackButton`       | Contextual back navigation                               |

---

## User / Profile Components

| Component          | Description                                              |
|--------------------|----------------------------------------------------------|
| `UserCard`         | Compact user profile card (avatar, name, role, rating)   |
| `VerifiedBadge`    | Green checkmark badge for verified users                 |
| `RoleChip`         | Colored chip showing user role                           |
| `ReviewCard`       | Single review display (avatar, stars, comment, date)     |
| `ReviewList`       | Paginated list of ReviewCards                            |

---

## Listing-Specific Components

| Component              | Description                                          |
|------------------------|------------------------------------------------------|
| `ListingCard`          | Grid card with image, title, price, location, seller |
| `ListingDetailHeader`  | Title, category, price, quantity, status             |
| `ListingMeta`          | Location, availability dates, tags                   |
| `OfferForm`            | Inline offer submission form                         |
| `OfferHistory`         | Timeline of offer/counter-offer exchanges            |
| `DemandCard`           | Agribusiness demand listing card                     |

---

## Transaction Components

| Component              | Description                                          |
|------------------------|------------------------------------------------------|
| `TransactionCard`      | Compact transaction summary card                     |
| `TransactionTimeline`  | Visual status timeline (offer → accepted → delivered)|
| `DisputeForm`          | Form to raise a transaction dispute                  |

---

## Messaging Components

| Component              | Description                                          |
|------------------------|------------------------------------------------------|
| `ConversationList`     | Sidebar list of conversations with last message      |
| `MessageBubble`        | Individual chat message (sent/received variants)     |
| `MessageThread`        | Scrollable conversation with MessageBubbles          |
| `MessageInput`         | Text input with send button and attachment option    |

---

## AI Advisor Components

| Component              | Description                                          |
|------------------------|------------------------------------------------------|
| `AIQueryForm`          | Input form for AI query (type-specific)              |
| `AIResponseCard`       | Formatted AI response with copy/save action          |
| `AIHistoryList`        | List of past AI queries with responses               |
| `AILoadingIndicator`   | Animated "thinking" indicator during AI call         |

---

## Notification Components

| Component              | Description                                          |
|------------------------|------------------------------------------------------|
| `NotificationItem`     | Single notification row (icon, title, time, read)   |
| `NotificationList`     | Full notification center list                        |
| `NotificationBell`     | Topbar bell icon with unread count badge             |

---

## Hooks (Shared Logic)

| Hook                   | Description                                          |
|------------------------|------------------------------------------------------|
| `useAuth`              | Current user, role, token from auth context          |
| `useApi`               | Axios wrapper with auth header injection             |
| `usePagination`        | Cursor/page-based pagination state                   |
| `useDebounce`          | Debounce a value (for search inputs)                 |
| `useLocalStorage`      | Typed localStorage get/set with reactivity           |
| `useNotifications`     | Fetch and manage notification state                  |
| `useGeolocation`       | Browser geolocation with permission handling         |
| `useFileUpload`        | S3 presigned URL upload with progress tracking       |
| `useAIAdvisor`         | Submit AI query and handle streaming/polling         |
