# BankOps Support Console Frontend Architecture

## Frontend Stack

The BankOps Support Console should be implemented as a separate frontend application using:

- React for the UI layer
- Vite for development server and build tooling
- TypeScript for type safety
- TailwindCSS for utility-first styling
- Axios for API calls to the FastAPI backend

The frontend should remain focused on internal operations workflows: support triage, customer context, ticket review, knowledge inspection, and metrics visibility.

## Page Structure

### Dashboard

Primary landing page for operational status.

Responsibilities:

- Show system health
- Show high-level support metrics
- Surface recent or priority tickets
- Link to common workflows

Primary APIs:

- `GET /health/deep`
- `GET /debug/metrics`
- `GET /debug/tickets`

### Chat Console

Interactive support workspace for testing and using the BankOps `/chat` flow.

Responsibilities:

- Send customer messages
- Display assistant replies
- Show detected intent
- Show escalation metadata
- Show decision trace
- Show recent conversation history

Primary APIs:

- `POST /chat`
- `GET /debug/conversations/{user_id}`
- `GET /debug/customer/{user_id}`

### Customer Profile

Customer context view for support staff.

Responsibilities:

- Display customer profile data
- Show card status and account risk level
- Show recent conversation history
- Show customer-specific tickets

Primary APIs:

- `GET /debug/customer/{user_id}`
- `GET /debug/conversations/{user_id}`
- `GET /debug/tickets/{user_id}`

### Ticket Queue

Operational ticket review page.

Responsibilities:

- Show all support tickets
- Filter by user, team, priority, issue type, and status
- Link tickets back to customer context

Primary APIs:

- `GET /debug/tickets`
- `GET /debug/tickets/{user_id}`

### Knowledge Search

RAG inspection page for knowledge retrieval.

Responsibilities:

- Search the keyword retriever
- Search the FAISS vector retriever
- Compare sources and returned chunks
- Display source filenames and content previews

Primary APIs:

- `GET /debug/rag/search?q=`
- `GET /debug/rag/vector-search?q=`

### Metrics

Focused observability page.

Responsibilities:

- Show persisted system metrics
- Display intent counts
- Display RAG retriever usage
- Display ticket and crew-review counters
- Show dependency health status

Primary APIs:

- `GET /debug/metrics`
- `GET /health/deep`

## Reusable Components

### Sidebar

Main navigation component.

Used for:

- Dashboard
- Chat Console
- Customer Profile
- Ticket Queue
- Knowledge Search
- Metrics

### Header

Top page header with title, optional user context, refresh controls, and status indicators.

### StatCard

Compact metric display component for totals, statuses, and counters.

Examples:

- Total chat requests
- Tickets created
- Vector RAG usage
- System health state

### ChatPanel

Composable chat interface component.

Includes:

- Message list
- Message input
- Send button
- Response metadata panel
- Decision trace display

### TicketTable

Reusable table for support-ticket data.

Includes:

- Ticket ID
- User ID
- Priority
- Assigned team
- Status
- Case summary
- Created timestamp

### MetricsChart

Simple chart component for metrics visualization.

Initial chart types:

- Bar chart for intent counts
- Bar chart for RAG retriever usage
- Count cards for event totals

### SourceList

Reusable list for RAG search results.

Includes:

- Filename
- Source path where available
- Score where available
- Content preview

## API Integration Layer

The frontend should centralize backend communication in an API layer instead of calling Axios directly from page components.

### chatApi

Methods:

- `sendMessage(payload)`

Backend endpoint:

- `POST /chat`

### customerApi

Methods:

- `getCustomer(userId)`
- `getConversationHistory(userId)`

Backend endpoints:

- `GET /debug/customer/{user_id}`
- `GET /debug/conversations/{user_id}`

### ticketApi

Methods:

- `getTickets()`
- `getTicketsForUser(userId)`

Backend endpoints:

- `GET /debug/tickets`
- `GET /debug/tickets/{user_id}`

### ragApi

Methods:

- `keywordSearch(query)`
- `vectorSearch(query)`

Backend endpoints:

- `GET /debug/rag/search?q=`
- `GET /debug/rag/vector-search?q=`

### metricsApi

Methods:

- `getMetricsSummary()`
- `getDeepHealth()`

Backend endpoints:

- `GET /debug/metrics`
- `GET /health/deep`

## Proposed Folder Structure

```text
frontend/
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  tailwind.config.ts
  postcss.config.js
  src/
    main.tsx
    App.tsx
    api/
      client.ts
      chatApi.ts
      customerApi.ts
      ticketApi.ts
      ragApi.ts
      metricsApi.ts
    components/
      layout/
        Sidebar.tsx
        Header.tsx
      cards/
        StatCard.tsx
      chat/
        ChatPanel.tsx
        DecisionTrace.tsx
      tickets/
        TicketTable.tsx
      metrics/
        MetricsChart.tsx
      rag/
        SourceList.tsx
    pages/
      Dashboard.tsx
      ChatConsole.tsx
      CustomerProfile.tsx
      TicketQueue.tsx
      KnowledgeSearch.tsx
      Metrics.tsx
    types/
      chat.ts
      customer.ts
      ticket.ts
      rag.ts
      metrics.ts
    utils/
      formatDate.ts
      statusLabels.ts
    styles/
      index.css
```

## API Client Design

`src/api/client.ts` should own the shared Axios instance:

- Base URL from environment variable, for example `VITE_API_BASE_URL`
- JSON headers
- Request timeout
- Shared error handling

Pages should import domain APIs such as `chatApi` or `ticketApi`, not the raw Axios client.

## State Management

Initial state can remain local to pages with React hooks:

- `useState`
- `useEffect`
- `useMemo`

Additional state libraries are not required for the MVP. If the console grows, server-state tooling such as TanStack Query can be considered later.

## Routing

Use React Router for page navigation:

```text
/                     -> Dashboard
/chat                 -> Chat Console
/customers/:userId    -> Customer Profile
/tickets              -> Ticket Queue
/knowledge            -> Knowledge Search
/metrics              -> Metrics
```

## Environment Configuration

Frontend environment variables should use Vite naming:

```text
VITE_API_BASE_URL=http://localhost:8000
```

No backend secrets or credentials should be exposed to the frontend.

## Implementation Notes

- Keep the first version read-heavy and inspection-focused.
- Do not expose debug endpoints publicly in production.
- Keep API response types explicit in `src/types`.
- Keep layout consistent and optimized for internal operations staff.
- Prefer clear status labels over decorative visuals.
