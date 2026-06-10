# BankOps Support Console Product Design

## Target User

The BankOps Support Console is designed for internal bank support and operations staff.

Primary users include:

- Customer support agents handling account and card enquiries
- Fraud operations analysts reviewing suspicious activity
- Escalation teams managing high-priority cases
- Support supervisors monitoring queues and workflow performance
- Operations engineers validating retrieval, orchestration, and system health

The console should prioritize fast scanning, clear status indicators, predictable navigation, and efficient access to customer context. It is an operational tool rather than a customer-facing banking application.

## Product Navigation

The primary navigation should provide direct access to:

- Overview
- Chat Console
- Customer Profile
- Ticket Queue
- Knowledge Search
- Metrics

Customer and ticket identifiers should link between relevant pages so staff can move from a conversation to a profile or ticket without repeating searches.

## Overview Dashboard

### Purpose

Provide an immediate operational summary of BankOps activity, system health, ticket workload, and recent support usage.

### Backend Endpoints Used

- `GET /health`
- `GET /health/deep`
- `GET /debug/metrics`
- `GET /debug/tickets`

### Key UI Components

- System health status with dependency-level checks
- Open ticket count
- Chat request and conversation totals
- Intent distribution
- RAG retriever usage
- Crew review counts
- Recent or high-priority ticket table
- Quick links to chat, tickets, and customer lookup

### Demo Value

Demonstrates that the backend supports more than chat responses. It shows persistence, observability, escalation workflows, semantic retrieval, and dependency health in one operational view.

## Chat Console

### Purpose

Allow support staff to send customer messages through the BankOps orchestration workflow and inspect the structured result.

### Backend Endpoints Used

- `POST /chat`
- `GET /debug/conversations/{user_id}`
- `GET /debug/customer/{user_id}`

### Key UI Components

- Customer ID selector or input
- Conversation transcript
- Message composer
- Assistant response panel
- Detected intent label
- Escalation status and ticket link
- Assigned team and priority indicators
- Human review status
- Expandable decision trace
- Recent customer conversation history

### Demo Value

Shows FastAPI and LangGraph working together across greeting, spending, fraud, escalation, and RAG paths. The decision trace makes workflow behavior visible during a portfolio demonstration.

## Customer Profile

### Purpose

Give staff a consolidated view of customer context before or during a support interaction.

### Backend Endpoints Used

- `GET /debug/customer/{user_id}`
- `GET /debug/conversations/{user_id}`
- `GET /debug/tickets/{user_id}`

### Key UI Components

- Customer name and ID
- Card status
- Account risk level
- Recent contact count
- Recent conversation timeline
- Customer-specific ticket list
- Priority and status indicators
- Links to continue the case in the Chat Console

### Demo Value

Demonstrates SQLite-backed customer memory and shows how previous interactions and active tickets can support more informed operations work.

## Ticket Queue

### Purpose

Allow support teams to review escalation tickets across customers and identify cases requiring urgent human attention.

### Backend Endpoints Used

- `GET /debug/tickets`
- `GET /debug/tickets/{user_id}`
- `GET /debug/customer/{user_id}`

### Key UI Components

- Sortable ticket table
- Filters for status, priority, assigned team, and issue type
- Ticket ID
- Customer ID
- Case summary
- Created timestamp
- Human review indicator where available
- Customer profile link
- Empty and loading states

### Demo Value

Shows that escalation decisions produce persistent operational records instead of only returning conversational text. It also demonstrates CrewAI-style recommendations influencing ticket priority and routing.

## Knowledge Search

### Purpose

Help staff inspect the support knowledge used by BankOps and compare keyword retrieval with local semantic vector search.

### Backend Endpoints Used

- `GET /debug/rag/search?q=`
- `GET /debug/rag/vector-search?q=`

### Key UI Components

- Knowledge query input
- Segmented control for keyword or vector search
- Ranked result list
- Source filename
- Retrieved content preview
- Result score for keyword matches
- Source path for vector results
- Empty-result and retrieval-error states

### Demo Value

Makes the RAG pipeline directly inspectable. It demonstrates the difference between keyword overlap and semantic retrieval without requiring a paid model API.

## Metrics Panel

### Purpose

Provide a focused view of persisted BankOps observability metrics for workflow analysis and demonstration.

### Backend Endpoints Used

- `GET /debug/metrics`
- `GET /health/deep`

### Key UI Components

- Total event count
- Total chat requests
- Conversations saved
- Intent-count chart
- Tickets-created count
- Vector and keyword RAG usage comparison
- Crew reviews completed
- Crew review debug calls
- Current dependency health
- Last refresh time and manual refresh control

### Demo Value

Shows that important workflow events are persisted and measurable. It provides visible evidence of chat usage, retrieval selection, ticket creation, and deterministic multi-agent review activity.

## Interaction and Visual Direction

The console should use a restrained operational design:

- Dense but readable tables and panels
- Clear typography and status hierarchy
- Consistent colors for healthy, warning, high-risk, and failed states
- Minimal decoration
- Predictable navigation
- Responsive layouts for desktop and tablet use
- Accessible labels, contrast, and keyboard navigation

Debug data should be presented as operational information rather than raw JSON by default. Raw responses and decision traces can remain available through expandable technical details.

## Initial Frontend Scope

The first frontend implementation should focus on read-only inspection plus the Chat Console:

1. Application shell and navigation
2. Overview Dashboard
3. Chat Console
4. Customer Profile
5. Ticket Queue
6. Knowledge Search
7. Metrics Panel

Ticket updates, customer changes, authentication, and role-based permissions should remain out of scope until corresponding backend workflows are defined.
