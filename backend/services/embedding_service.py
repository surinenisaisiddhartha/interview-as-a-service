"""
embedding_service.py — Consolidated logic for text embeddings and vector storage.

Handles:
1. SentenceTransformer singleton loading.
2. Text building for candidates and jobs.
3. Upserting vectors to Qdrant.
4. Semantic similarity calculations.
"""

from __future__ import annotations

from qdrant_client.models import PointStruct, Filter, FieldCondition, MatchValue
from log import log_tool
from utils.qdrant_client_wrapper import (
    get_qdrant_client,
    COLLECTION_CANDIDATES,
    COLLECTION_JOBS,
)

# ─── Embedding Model Logic (Singleton) ────────────────────────────────────────

_model = None
_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

def _get_model():
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _model = SentenceTransformer(_MODEL_NAME)
            log_tool.log_info("Embedding model loaded: %s" % _MODEL_NAME)
        except Exception as e:
            log_tool.log_error("Failed to load embedding model: %s" % e)
            raise
    return _model

def embed(text: str) -> list[float]:
    """Embed a text string and return a 384-dimensional float list."""
    model = _get_model()
    log_tool.log_debug("Embedding text (length=%d chars)..." % len(text))
    vector = model.encode(text, convert_to_numpy=True).tolist()
    log_tool.log_debug("Embedding generated (384-d vector created).")
    return vector

# ─── Text Builders ────────────────────────────────────────────────────────────

def _candidate_text(candidate) -> str:
    """Build a single string from a Candidate ORM object for embedding."""
    parts: list[str] = []
    if isinstance(candidate.skills, dict):
        for skill_list in candidate.skills.values():
            if isinstance(skill_list, list):
                parts.extend(skill_list)
    if candidate.current_designation:
        parts.append(candidate.current_designation)
    if candidate.highest_degree or candidate.institution:
        education = f"{candidate.highest_degree or ''} from {candidate.institution or ''}".strip()
        parts.append(f"Education: {education}")
    if candidate.summary:
        parts.append(candidate.summary)
    return " ".join(parts)

def _job_text(job) -> str:
    """Build a single string from a Job ORM object for embedding."""
    parts: list[str] = []
    if isinstance(job.required_skills, list):
        parts.extend(job.required_skills)
    if isinstance(job.preferred_skills, list):
        parts.extend(job.preferred_skills)
    if job.title:
        parts.append(job.title)
    if job.summary:
        parts.append(job.summary)
    return " ".join(parts)

# ─── Vector Operations ─────────────────────────────────────────────────────────

def upsert_candidate_vector(candidate_id: int, candidate) -> None:
    """Embed candidate profile and upsert to Qdrant."""
    try:
        text = _candidate_text(candidate)
        log_tool.log_debug("Candidate id=%s built text: %s..." % (candidate_id, text[:100]))
        if not text.strip():
            log_tool.log_warning("Candidate id=%s has no text to embed — skipping." % candidate_id)
            return

        vector = embed(text)
        client = get_qdrant_client()
        
        # Build payload with metadata
        payload = {"candidate_id": candidate_id}
        if candidate.raw_resume_json:
            # Ensure we are passing a dict to Qdrant, not a string or nested wrapper
            payload_data = candidate.raw_resume_json
            if isinstance(payload_data, dict) and "candidate" in payload_data:
                 payload.update(payload_data["candidate"])
            elif isinstance(payload_data, dict):
                 payload.update(payload_data)
        
        log_tool.log_debug(f"Upserting candidate {candidate_id} to Qdrant with payload keys: {list(payload.keys())}")

        client.upsert(
            collection_name=COLLECTION_CANDIDATES,
            points=[PointStruct(id=candidate_id, vector=vector, payload=payload)],
        )
        log_tool.log_info("Qdrant: upserted candidate vector id=%s with full metadata" % candidate_id)
    except Exception as e:
        log_tool.log_warning("Qdrant upsert failed for candidate id=%s: %s" % (candidate_id, e))

def upsert_job_vector(job_id: int, job) -> None:
    """Embed job description and upsert to Qdrant."""
    try:
        text = _job_text(job)
        log_tool.log_debug("Job id=%s built text: %s..." % (job_id, text[:100]))
        if not text.strip():
            log_tool.log_warning("Job id=%s has no text to embed — skipping." % job_id)
            return

        vector = embed(text)
        client = get_qdrant_client()
        payload = {"job_id": job_id}
        if job.raw_job_json:
            payload.update(job.raw_job_json)

        client.upsert(
            collection_name=COLLECTION_JOBS,
            points=[PointStruct(id=job_id, vector=vector, payload=payload)],
        )
        log_tool.log_info("Qdrant: upserted job vector id=%s with full metadata" % job_id)
    except Exception as e:
        log_tool.log_warning("Qdrant upsert failed for job id=%s: %s" % (job_id, e))

def get_embedding_similarity(candidate_id: int, job_id: int) -> float:
    """Compute cosine similarity between a candidate and a job via Qdrant."""
    try:
        from db.database import SessionLocal
        from db.models import Candidate, Job

        client = get_qdrant_client()
        log_tool.log_debug("get_embedding_similarity: querying candidate_id=%s vs job_id=%s" % (candidate_id, job_id))

        results = client.retrieve(
            collection_name=COLLECTION_CANDIDATES,
            ids=[candidate_id],
            with_vectors=True,
        )
        if not results:
            log_tool.log_warning("get_embedding_similarity: candidate id=%s not found in Qdrant. Attempting to embed." % candidate_id)
            db = SessionLocal()
            try:
                candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
                if candidate:
                    upsert_candidate_vector(candidate_id, candidate)
                    results = client.retrieve(
                        collection_name=COLLECTION_CANDIDATES,
                        ids=[candidate_id],
                        with_vectors=True,
                    )
            finally:
                db.close()
                
            if not results:
                log_tool.log_warning("get_embedding_similarity: candidate id=%s still not found in Qdrant." % candidate_id)
                return 0.0

        candidate_vector = results[0].vector
        search_results = client.search(
            collection_name=COLLECTION_JOBS,
            query_vector=candidate_vector,
            query_filter=Filter(
                must=[FieldCondition(key="job_id", match=MatchValue(value=job_id))]
            ),
            limit=1,
        )

        if not search_results:
            log_tool.log_warning("get_embedding_similarity: job id=%s not found in Qdrant. Attempting to embed." % job_id)
            db = SessionLocal()
            try:
                job = db.query(Job).filter(Job.id == job_id).first()
                if job:
                    upsert_job_vector(job_id, job)
                    search_results = client.search(
                        collection_name=COLLECTION_JOBS,
                        query_vector=candidate_vector,
                        query_filter=Filter(
                            must=[FieldCondition(key="job_id", match=MatchValue(value=job_id))]
                        ),
                        limit=1,
                    )
            finally:
                db.close()

            if not search_results:
                log_tool.log_warning("get_embedding_similarity: job id=%s still not found in Qdrant." % job_id)
                return 0.0

        score: float = search_results[0].score
        log_tool.log_info("Qdrant: semantic similarity (candidate=%s, job=%s) = %.4f" % (candidate_id, job_id, score))
        return max(0.0, min(1.0, float(score)))
    except Exception as e:
        log_tool.log_warning("get_embedding_similarity failed (candidate=%s, job=%s): %s" % (candidate_id, job_id, e))
        return 0.0
