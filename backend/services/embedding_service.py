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

import uuid

_model = None
_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

def _str_to_uuid(text_id: str) -> str:
    """Convert any string ID into a deterministic UUID for Qdrant."""
    return str(uuid.uuid5(uuid.NAMESPACE_OID, str(text_id)))

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

def _cand_skills(candidate) -> str:
    parts = []
    if isinstance(candidate.skills, dict):
        for skill_list in candidate.skills.values():
            if isinstance(skill_list, list):
                parts.extend(skill_list)
    return " ".join(parts)

def _cand_education(candidate) -> str:
    return f"{candidate.highest_degree or ''} {candidate.highest_degree_name or ''} {candidate.institution or ''}".strip()

def _job_req_skills(job) -> str:
    return " ".join(job.required_skills) if isinstance(job.required_skills, list) else ""

def _job_pref_skills(job) -> str:
    return " ".join(job.preferred_skills) if isinstance(job.preferred_skills, list) else ""

def _job_education(job) -> str:
    if job.raw_job_json and isinstance(job.raw_job_json, dict):
        return str(job.raw_job_json.get('education_requirements', ''))
    return ""

def _job_role(job) -> str:
    parts = []
    if job.title: parts.append(job.title)
    if job.summary: parts.append(job.summary)
    return " ".join(parts)

# ─── Vector Operations ─────────────────────────────────────────────────────────

def upsert_candidate_vector(candidate_id: str, candidate) -> None:
    """Embed candidate profile and upsert to Qdrant."""
    try:
        # Named vectors mapping
        vectors = {}
        
        req_skills_text = _cand_skills(candidate)
        if req_skills_text.strip():
            vectors["skills"] = embed(req_skills_text)
            
        edu_text = _cand_education(candidate)
        if edu_text.strip():
            vectors["education"] = embed(edu_text)

        if not vectors:
            log_tool.log_warning("Candidate id=%s has no text to embed — skipping." % candidate_id)
            return

        client = get_qdrant_client()
        
        # Build payload with metadata
        payload = {"candidate_id": candidate_id}
        if candidate.raw_resume_json:
            payload_data = candidate.raw_resume_json
            if isinstance(payload_data, dict) and "candidate" in payload_data:
                 payload.update(payload_data["candidate"])
            elif isinstance(payload_data, dict):
                 payload.update(payload_data)
        
        log_tool.log_debug(f"Upserting candidate {candidate_id} to Qdrant with named vectors and payload keys.")

        client.upsert(
            collection_name=COLLECTION_CANDIDATES,
            points=[PointStruct(id=_str_to_uuid(candidate_id), vector=vectors, payload=payload)],
        )
        log_tool.log_info("Qdrant: upserted candidate vector id=%s with full metadata" % candidate_id)
    except Exception as e:
        log_tool.log_warning("Qdrant upsert failed for candidate id=%s: %s" % (candidate_id, e))

def upsert_job_vector(job_id: str, job) -> None:
    """Embed job description and upsert to Qdrant."""
    try:
        vectors = {}
        
        req_text = _job_req_skills(job)
        if req_text.strip(): vectors["required_skills"] = embed(req_text)
            
        pref_text = _job_pref_skills(job)
        if pref_text.strip(): vectors["preferred_skills"] = embed(pref_text)
            
        edu_text = _job_education(job)
        if edu_text.strip(): vectors["education"] = embed(edu_text)
            
        role_text = _job_role(job)
        if role_text.strip(): vectors["role"] = embed(role_text)

        if not vectors:
            log_tool.log_warning("Job id=%s has no text to embed — skipping." % job_id)
            return

        client = get_qdrant_client()
        payload = {"job_id": job_id}
        if job.raw_job_json:
            payload.update(job.raw_job_json)

        client.upsert(
            collection_name=COLLECTION_JOBS,
            points=[PointStruct(id=_str_to_uuid(job_id), vector=vectors, payload=payload)],
        )
        log_tool.log_info("Qdrant: upserted job vector id=%s with full metadata" % job_id)
    except Exception as e:
        log_tool.log_warning("Qdrant upsert failed for job id=%s: %s" % (job_id, e))

def get_category_similarities(candidate_id: str, job_id: str) -> dict:
    """Compute cosine similarities across named vectors (skills, education) via Qdrant."""
    default_sims = {"required_skills_sim": 0.0, "preferred_skills_sim": 0.0, "education_sim": 0.0}
    try:
        from db.database import SessionLocal
        from db.models import Candidate, Job

        client = get_qdrant_client()
        log_tool.log_debug("get_category_similarities: querying candidate_id=%s vs job_id=%s" % (candidate_id, job_id))

        cand_uuid = _str_to_uuid(candidate_id)
        job_uuid = _str_to_uuid(job_id)

        cand_res = client.retrieve(collection_name=COLLECTION_CANDIDATES, ids=[cand_uuid], with_vectors=True)
        if not cand_res:
            db = SessionLocal()
            try:
                candidate = db.query(Candidate).filter(Candidate.s3_candidate_id == candidate_id).first()
                if candidate: upsert_candidate_vector(candidate_id, candidate)
            finally:
                db.close()
            cand_res = client.retrieve(collection_name=COLLECTION_CANDIDATES, ids=[cand_uuid], with_vectors=True)

        job_res = client.retrieve(collection_name=COLLECTION_JOBS, ids=[job_uuid], with_vectors=True)
        if not job_res:
            db = SessionLocal()
            try:
                job = db.query(Job).filter(Job.s3_job_id == job_id).first()
                if job: upsert_job_vector(job_id, job)
            finally:
                db.close()
            job_res = client.retrieve(collection_name=COLLECTION_JOBS, ids=[job_uuid], with_vectors=True)

        if not cand_res or not job_res:
            return default_sims

        cand_vectors = cand_res[0].vector or {}
        job_vectors = job_res[0].vector or {}

        def calc_sim(v1, v2):
            import math
            if not v1 or not v2: return 0.0
            dot_product = sum(a * b for a, b in zip(v1, v2))
            norm_v1 = math.sqrt(sum(a * a for a in v1))
            norm_v2 = math.sqrt(sum(b * b for b in v2))
            if norm_v1 == 0 or norm_v2 == 0: return 0.0
            return max(0.0, min(1.0, float(dot_product / (norm_v1 * norm_v2))))

        sims = {
            "required_skills_sim": calc_sim(cand_vectors.get("skills"), job_vectors.get("required_skills")),
            "preferred_skills_sim": calc_sim(cand_vectors.get("skills"), job_vectors.get("preferred_skills")),
            "education_sim": calc_sim(cand_vectors.get("education"), job_vectors.get("education"))
        }
        
        log_tool.log_info(f"Categorical Similarities calculated (candidate={candidate_id}, job={job_id}): {sims}")
        return sims
    except Exception as e:
        log_tool.log_warning("get_category_similarities failed (candidate=%s, job=%s): %s" % (candidate_id, job_id, e))
        return default_sims
