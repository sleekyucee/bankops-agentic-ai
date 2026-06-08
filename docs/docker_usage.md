# Docker Usage for BankOps

## Build the Image

Run the following command from the project root:

```bash
docker build -t bankops-agentic-ai .
```

The first build may take several minutes because the project includes machine-learning dependencies such as Sentence Transformers, PyTorch-related packages, and FAISS.

## Run the Container

Map the container's port `8000` to port `8000` on the host:

```bash
docker run --name bankops-api -p 8000:8000 bankops-agentic-ai
```

The API will be available at:

```text
http://localhost:8000
```

FastAPI documentation will be available at:

```text
http://localhost:8000/docs
```

The `-p 8000:8000` option maps:

```text
host port 8000 -> container port 8000
```

To use a different host port, keep the container port as `8000`:

```bash
docker run --name bankops-api -p 8080:8000 bankops-agentic-ai
```

The API would then be available at `http://localhost:8080`.

## Run in the Background

Use detached mode to run the container in the background:

```bash
docker run -d --name bankops-api -p 8000:8000 bankops-agentic-ai
```

View container logs with:

```bash
docker logs bankops-api
```

Follow logs continuously with:

```bash
docker logs -f bankops-api
```

## Pass Environment Variables

Pass individual environment variables with `-e`:

```bash
docker run --name bankops-api -p 8000:8000 \
  -e APP_NAME="BankOps Agentic AI" \
  -e DATABASE_PATH="bankops.db" \
  -e KNOWLEDGE_BASE_PATH="knowledge_base" \
  -e LOG_LEVEL="INFO" \
  bankops-agentic-ai
```

On Windows PowerShell, the same command can be written as:

```powershell
docker run --name bankops-api -p 8000:8000 `
  -e APP_NAME="BankOps Agentic AI" `
  -e DATABASE_PATH="bankops.db" `
  -e KNOWLEDGE_BASE_PATH="knowledge_base" `
  -e LOG_LEVEL="INFO" `
  bankops-agentic-ai
```

An environment file may also be supplied at runtime:

```bash
docker run --name bankops-api -p 8000:8000 --env-file .env bankops-agentic-ai
```

The environment file is read by Docker at runtime. It should not be copied into the image or committed to source control.

## Stop and Remove the Container

Stop a running container:

```bash
docker stop bankops-api
```

Remove the stopped container:

```bash
docker rm bankops-api
```

To stop and remove it in one command:

```bash
docker rm -f bankops-api
```

## Image Size Considerations

The Sentence Transformers model and supporting machine-learning libraries can significantly increase image and container size. The model may also be downloaded when semantic vector search is first used, depending on the image cache and local model availability.

Before deployment, measure:

- Built image size
- Container startup time
- First vector-search latency
- Runtime memory use
- Model cache behavior

## Data and Secret Handling

Do not copy `.env` or `bankops.db` into the Docker image.

The project's `.dockerignore` excludes these files:

```text
.env
bankops.db
*.db
```

Pass configuration at runtime through environment variables. For persistent database storage in later phases, use an external database or an explicitly managed Docker volume rather than embedding the SQLite database in the image.
