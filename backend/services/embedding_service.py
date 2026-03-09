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


def calc_sim(v1: list[float], v2: list[float]) -> float:
    """Compute cosine similarity between two float vectors."""
    import math
    if not v1 or not v2: return 0.0
    # Vectors must have same length
    if len(v1) != len(v2): return 0.0
    
    dot_product = sum(a * b for a, b in zip(v1, v2))
    norm_v1 = math.sqrt(sum(a * a for a in v1))
    norm_v2 = math.sqrt(sum(b * b for b in v2))
    if norm_v1 == 0 or norm_v2 == 0: return 0.0
    return max(0.0, min(1.0, float(dot_product / (norm_v1 * norm_v2))))

def _score_list_similarity(jd_items: list[str], cand_items: list[str]) -> float:
    """
    Granular matching: For each item in JD, find the best semantic match in candidate list.
    Returns average of maximum similarities.
    """
    if not jd_items or not cand_items:
        return 0.0
    
    # 1. Deduplicate and clean
    jd_items = list(set([str(s).strip().lower() for s in jd_items if s]))
    cand_items = list(set([str(s).strip().lower() for s in cand_items if s]))
    
    if not jd_items or not cand_items:
        return 0.0

    # 2. Embed all (MiniLM is fast enough for ~50 strings on the fly)
    jd_vectors = [embed(s) for s in jd_items]
    cand_vectors = [embed(s) for s in cand_items]
    
    # 3. For each JD requirement, find its 'soulmate' in candidate list
    total_max_sim = 0.0
    for j_vec in jd_vectors:
        best_for_this_req = max([calc_sim(j_vec, c_vec) for c_vec in cand_vectors])
        total_max_sim += best_for_this_req
        
    return total_max_sim / len(jd_items)

# ─── Text Builders ────────────────────────────────────────────────────────────

def _cand_skills(candidate) -> str:
    parts = []
    # Try both 'skills' and user custom field names
    skills_data = getattr(candidate, "skills", None) or getattr(candidate, "key_skills", None)
    
    if isinstance(skills_data, dict):
        for skill_list in skills_data.values():
            if isinstance(skill_list, list):
                parts.extend(skill_list)
            elif isinstance(skill_list, str):
                parts.append(skill_list)
    elif isinstance(skills_data, list):
        parts.extend(skills_data)
        
    return " ".join(parts)

def _cand_education(candidate) -> str:
    return f"{candidate.highest_degree or ''} {candidate.highest_degree_name or ''} {candidate.institution or ''}".strip()

def _job_req_skills(job) -> list[str]:
    skills = job.required_skills
    if isinstance(skills, list): return [str(s) for s in skills]
    return []

def _job_pref_skills(job) -> list[str]:
    skills = job.preferred_skills
    if isinstance(skills, list): return [str(s) for s in skills]
    return []

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
        
        req_list = _job_req_skills(job)
        if req_list: vectors["required_skills"] = embed(" ".join(req_list))
            
        pref_list = _job_pref_skills(job)
        if pref_list: vectors["preferred_skills"] = embed(" ".join(pref_list))
            
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
    """Compute granular similarities with robust payload extraction and DB fallback."""
    default_sims = {"required_skills_sim": 0.0, "preferred_skills_sim": 0.0, "education_sim": 0.0}
    db = None
    try:
        from db.database import SessionLocal
        from db.models import Candidate, Job
        db = SessionLocal()

        client = get_qdrant_client()
        cand_uuid = _str_to_uuid(candidate_id)
        job_uuid = _str_to_uuid(job_id)

        # 1. Retrieve Qdrant Data
        cand_res = client.retrieve(collection_name=COLLECTION_CANDIDATES, ids=[cand_uuid], with_vectors=True, with_payload=True)
        job_res = client.retrieve(collection_name=COLLECTION_JOBS, ids=[job_uuid], with_vectors=True, with_payload=True)

        # 2. Fetch DB Models (Fallback / Source of truth for lists)
        candidate = db.query(Candidate).filter(Candidate.s3_candidate_id == candidate_id).first()
        job = db.query(Job).filter(Job.s3_job_id == job_id).first()

        if not candidate or not job:
            log_tool.log_warning(f"DB mismatch: Candidate={candidate_id} or Job={job_id} not found in PostgreSQL.")
            return default_sims

        # 3. Extract Candidate Skills (Robust: Payload -> DB Model)
        candidate_skill_list = []
        if cand_res:
            payload = cand_res[0].payload or {}
            # Check root and nested 'candidate' key
            cand_data = payload.get("candidate") if isinstance(payload.get("candidate"), dict) else payload
            skills_raw = cand_data.get("Key Skills") or cand_data.get("skills")
            
            if isinstance(skills_raw, dict):
                for sub in skills_raw.values():
                    if isinstance(sub, list): candidate_skill_list.extend(sub)
                    elif isinstance(sub, str): candidate_skill_list.append(sub)
            elif isinstance(skills_raw, list):
                candidate_skill_list = skills_raw

        # Fallback to DB model if payload extraction failed
        if not candidate_skill_list and candidate.skills:
            if isinstance(candidate.skills, dict):
                for sub in candidate.skills.values():
                    if isinstance(sub, list): candidate_skill_list.extend(sub)
            elif isinstance(candidate.skills, list):
                candidate_skill_list = candidate.skills

        # 4. Extract Job Skills (Robust: Payload -> DB Model)
        job_required = []
        job_preferred = []
        if job_res:
            payload = job_res[0].payload or {}
            job_data = payload.get("job") if isinstance(payload.get("job"), dict) else payload
            job_required = job_data.get("required_skills") or []
            job_preferred = job_data.get("preferred_skills") or []

        # Fallback to DB model
        if not job_required and job.required_skills:
            job_required = job.required_skills
        if not job_preferred and job.preferred_skills:
            job_preferred = job.preferred_skills

        # 5. Perform Matching
        log_tool.log_info(f"Granular Matching: Cand={len(candidate_skill_list)} skills, Job={len(job_required)} reqs")
        
        req_sim = _score_list_similarity(job_required, candidate_skill_list)
        pref_sim = _score_list_similarity(job_preferred, candidate_skill_list)
        
        # 6. Education Matching (Robust: Vector -> On-the-fly Embedding)
        edu_sim = 0.0
        cand_vectors = cand_res[0].vector if cand_res else {}
        job_vectors = job_res[0].vector if job_res else {}
        
        c_edu_v = cand_vectors.get("education") if isinstance(cand_vectors, dict) else None
        j_edu_v = job_vectors.get("education") if isinstance(job_vectors, dict) else None
        
        if c_edu_v and j_edu_v:
            edu_sim = calc_sim(c_edu_v, j_edu_v)
        else:
            # Re-embed if vectors are missing (Named vectors might be absent if using old data)
            c_edu_text = _cand_education(candidate)
            j_edu_text = _job_education(job)
            if c_edu_text.strip() and j_edu_text.strip():
                edu_sim = calc_sim(embed(c_edu_text), embed(j_edu_text))

        sims = {
            "required_skills_sim": float(round(req_sim, 4)),
            "preferred_skills_sim": float(round(pref_sim, 4)),
            "education_sim": float(round(edu_sim, 4))
        }
        
        log_tool.log_info(f"Granular Results for {candidate_id}: {sims}")
        return sims

    except Exception as e:
        log_tool.log_error(f"Critical failure in granular matching: {e}")
        import traceback
        log_tool.log_error(traceback.format_exc())
        return default_sims
    finally:
        if db: db.close()
