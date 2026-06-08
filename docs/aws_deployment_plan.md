# AWS Deployment Plan for BankOps

## Goal

This document outlines how the BankOps local MVP could move to AWS in controlled phases. The initial objective is to preserve the existing application behavior while replacing local infrastructure with managed services where that provides clear operational value.

The migration should remain incremental. Local development should continue to be the default environment until deployment, security, performance, and cost requirements are understood.

## Current Local Architecture

The current MVP runs as a local Python application with:

- FastAPI for HTTP endpoints and request validation
- LangGraph for intent routing and workflow orchestration
- SQLite for customer profiles, conversations, support tickets, and metrics
- A local `knowledge_base` folder containing Markdown support documents
- Local FAISS vector search using Sentence Transformers embeddings
- Deterministic CrewAI-style specialist review for escalation decisions
- Unauthenticated debug endpoints for inspecting local data and workflow behavior

This architecture is appropriate for development and portfolio demonstration, but it does not yet provide the availability, security, scalability, or operational controls expected from a deployed banking support system.

## Target AWS Architecture

| Local component | Potential AWS target | Notes |
| --- | --- | --- |
| FastAPI application | AWS App Runner or Amazon ECS on Fargate | App Runner is simpler for an initial container deployment. ECS Fargate provides more networking and runtime control. |
| SQLite | Amazon RDS for PostgreSQL | Use migrations and connection pooling before switching production traffic. |
| Local `knowledge_base` folder | Amazon S3 | Store versioned support documents in a private bucket with restricted access. |
| Local FAISS vector store | Amazon OpenSearch Serverless or another managed vector store | Evaluate retrieval quality, indexing cost, and operational complexity before migration. |
| Local Sentence Transformers embeddings | Amazon Bedrock embeddings, SageMaker, or embeddings hosted inside the application container | Select based on privacy, latency, container size, and cost requirements. |
| Future response-synthesis LLM | Amazon Bedrock | Keep deterministic fallbacks and apply model access controls, prompt logging policies, and output validation. |
| Local logs and SQLite metrics | Amazon CloudWatch Logs and CloudWatch Metrics | Add structured logs, alarms, dashboards, and retention settings. |
| Local environment variables and secrets | AWS Secrets Manager | Retrieve secrets through an IAM role rather than storing credentials in files or images. |
| Public API access | Amazon API Gateway or an App Runner authentication layer | Add authentication, throttling, request limits, and access logging before public exposure. |

A possible target request path is:

```text
Client
  -> API Gateway or App Runner access layer
  -> FastAPI container on App Runner or ECS Fargate
  -> LangGraph workflows and CrewAI-style review
  -> RDS PostgreSQL
  -> S3 knowledge documents
  -> OpenSearch Serverless or managed vector retrieval
  -> Amazon Bedrock for future model inference
  -> CloudWatch logs and metrics
```

## Migration Phases

### 1. Containerize the Application

- Add a production-focused Dockerfile.
- Run Uvicorn with an appropriate process model.
- Define health checks and environment-based configuration.
- Measure image size, startup time, memory use, and local embedding-model behavior.
- Deploy initially to App Runner or ECS Fargate in a private test environment.

### 2. Move the Database to PostgreSQL and RDS

- Introduce PostgreSQL-compatible database access.
- Add a migration tool and versioned schema changes.
- Replace SQLite-specific assumptions.
- Create an RDS PostgreSQL instance with encryption, backups, and restricted networking.
- Test data migration and rollback before switching application traffic.

### 3. Move Knowledge Documents to S3

- Create a private, versioned S3 bucket.
- Upload Markdown knowledge documents.
- Update ingestion to read from S3 through an IAM role.
- Define document refresh and re-indexing behavior.
- Keep local files available for development and automated tests.

### 4. Add Bedrock LLM Synthesis

- Introduce Amazon Bedrock only after retrieval quality is validated.
- Keep vector retrieval separate from answer synthesis.
- Add prompt templates, output constraints, timeouts, and deterministic fallback behavior.
- Avoid sending unnecessary customer information to model endpoints.
- Record model usage and cost metrics.

### 5. Add CloudWatch Logging

- Emit structured application and workflow logs.
- Add correlation IDs for requests, tickets, and graph executions.
- Publish key operational metrics such as latency, errors, ticket creation, retrieval usage, and model failures.
- Configure alarms and log retention policies.

### 6. Add Authentication and Security

- Protect the API through API Gateway, an identity provider, or an authenticated App Runner access layer.
- Disable or restrict debug endpoints outside development environments.
- Store secrets in Secrets Manager.
- Apply least-privilege IAM roles.
- Add request validation, rate limits, audit logging, and network controls.

### 7. Add an Optional Frontend or Operations Dashboard

- Build a separate authenticated interface for support teams.
- Display tickets, customer context, conversation history, metrics, and review status.
- Keep administrative actions separate from public customer endpoints.

## Cost Control Notes

- Continue using local development for routine implementation and testing.
- Avoid Bedrock model calls until deterministic and retrieval-only behavior is insufficient.
- Use AWS free-tier allowances cautiously; eligibility and limits vary by service and account.
- Prefer small test environments and scale only after measuring actual demand.
- Shut down or delete unused RDS, OpenSearch, ECS, SageMaker, and test resources.
- Configure AWS Budgets and billing alerts before provisioning persistent services.
- Review CloudWatch retention settings to prevent unnecessary storage costs.
- Measure embedding and vector-search workloads before selecting a managed service.

## What Not To Deploy Yet

- Do not deploy the FAISS-heavy flow until container size, cold-start time, memory use, CPU performance, and model-download behavior have been tested.
- Do not expose debug endpoints publicly. Disable them or protect them with strict authentication and authorization.
- Do not commit API keys, cloud credentials, database passwords, `.env` files, or other secrets.
- Do not introduce Bedrock or another live LLM until data-handling rules, output validation, cost controls, and fallback behavior are defined.
- Do not migrate SQLite data without schema migrations, backups, and a tested rollback plan.
- Do not treat the current MVP as production-ready without security review, automated testing, observability, and operational runbooks.
