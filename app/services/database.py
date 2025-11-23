"""
MongoDB database service for storing audit results.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pymongo import MongoClient, DESCENDING
from app.schemas import AuditResponse, AuditItem, Rule


# MongoDB connection
client = MongoClient("mongodb://localhost:27017/")
db = client["policy_sentinel"]
audits_collection = db["audits"]


def store_audit_result(audit_response: AuditResponse) -> str:
    """
    Store an audit result in MongoDB.
    
    Args:
        audit_response: The complete audit response to store
        
    Returns:
        str: The MongoDB document ID
    """
    # Convert Pydantic models to dict
    audit_doc = {
        "policy_name": audit_response.policy_name,
        "total_rules": audit_response.total_rules,
        "total_models": audit_response.total_models,
        "rules": [rule.model_dump() for rule in audit_response.rules],
        "audit_results": [item.model_dump() for item in audit_response.audit_results],
        "created_at": datetime.utcnow(),
        "timestamp": datetime.utcnow().isoformat()
    }
    
    result = audits_collection.insert_one(audit_doc)
    return str(result.inserted_id)


def get_latest_audit() -> Optional[Dict[str, Any]]:
    """
    Get the most recent audit result.
    
    Returns:
        Dict or None: The latest audit document
    """
    result = audits_collection.find_one(
        sort=[("created_at", DESCENDING)]
    )
    
    if result:
        # Convert ObjectId to string
        result["_id"] = str(result["_id"])
    
    return result


def get_all_audits(limit: int = 10) -> List[Dict[str, Any]]:
    """
    Get recent audit results.
    
    Args:
        limit: Maximum number of results to return
        
    Returns:
        List of audit documents
    """
    results = audits_collection.find(
        sort=[("created_at", DESCENDING)],
        limit=limit
    )
    
    audits = []
    for result in results:
        result["_id"] = str(result["_id"])
        audits.append(result)
    
    return audits


def get_audit_by_id(audit_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a specific audit by ID.
    
    Args:
        audit_id: The MongoDB document ID
        
    Returns:
        Dict or None: The audit document
    """
    from bson.objectid import ObjectId
    
    try:
        result = audits_collection.find_one({"_id": ObjectId(audit_id)})
        if result:
            result["_id"] = str(result["_id"])
        return result
    except:
        return None


def convert_audit_doc_to_response(audit_doc: Dict[str, Any]) -> AuditResponse:
    """
    Convert a MongoDB audit document back to AuditResponse.
    
    Args:
        audit_doc: The MongoDB document
        
    Returns:
        AuditResponse object
    """
    return AuditResponse(
        policy_name=audit_doc["policy_name"],
        total_rules=audit_doc["total_rules"],
        total_models=audit_doc["total_models"],
        rules=[Rule(**rule) for rule in audit_doc["rules"]],
        audit_results=[AuditItem(**item) for item in audit_doc["audit_results"]]
    )
