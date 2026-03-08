"""
qdrant_client_wrapper.py — Singleton Qdrant client + collection bootstrap.

Collections created on first use:
  - candidates  : 384-d cosine vectors  (one point per candidate)
  - jobs        : 384-d cosine vectors  (one point per job)
"""

import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PayloadSchemaType

from log import log_tool

# Load .env explicitly from project root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dotenv_path = os.path.join(BASE_DIR, '.env')

if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)
    log_tool.log_info(f"Qdrant: Loaded .env from {dotenv_path}")
else:
    load_dotenv()

QDRANT_MODE    = str(os.getenv("QDRANT_MODE", "server")).lower()
QDRANT_URL     = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", None)

VECTOR_SIZE = 384        # all-MiniLM-L6-v2 output dimension
COLLECTION_CANDIDATES = "candidates_v2"
COLLECTION_JOBS = "jobs_v2"

_client: QdrantClient | None = None


def get_qdrant_client() -> QdrantClient:
    """Return the singleton Qdrant client, creating collections if needed."""
    global _client
    if _client is None:
        log_tool.log_info(f"Qdrant: initializing client (mode={QDRANT_MODE})...")
        if QDRANT_MODE == "memory":
            _client = QdrantClient(":memory:")
            log_tool.log_info("Qdrant: running in-memory (no server required).")
        else:
            url = QDRANT_URL.split('#')[0].rstrip('/')
            log_tool.log_info(f"Qdrant: connecting to cloud endpoint {url}")
            _client = QdrantClient(url=url, api_key=QDRANT_API_KEY)
            
        _ensure_collections(_client)
    return _client


def _ensure_collections(client: QdrantClient) -> None:
    """Create 'candidates' and 'jobs' collections and indices if they don't exist yet."""
    existing = {c.name for c in client.get_collections().collections}

    for name in (COLLECTION_CANDIDATES, COLLECTION_JOBS):
        if name not in existing:
            if name == COLLECTION_CANDIDATES:
                vectors_config = {
                    "skills": VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
                    "education": VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
                }
            else:
                vectors_config = {
                    "required_skills": VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
                    "preferred_skills": VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
                    "education": VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
                    "role": VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
                }
            
            client.create_collection(
                collection_name=name,
                vectors_config=vectors_config,
            )
            log_tool.log_info("Qdrant: created collection '%s' with named vectors" % name)
        else:
            log_tool.log_info("Qdrant: collection '%s' already exists." % name)

    # ── CREATE PAYLOAD INDICES ──
    try:
        client.create_payload_index(
            collection_name=COLLECTION_CANDIDATES,
            field_name="candidate_id",
            field_schema=PayloadSchemaType.KEYWORD,
        )
        client.create_payload_index(
            collection_name=COLLECTION_JOBS,
            field_name="job_id",
            field_schema=PayloadSchemaType.KEYWORD,
        )
        log_tool.log_info("Qdrant: ensured payload indices exist for filtered searches.")
    except Exception as e:
        log_tool.log_warning("Qdrant: could not ensure payload indices: %s" % e)
