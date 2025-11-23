"""
Policy Sentinel - FastAPI Backend
Main application entry point.
"""
import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from sse_starlette.sse import EventSourceResponse
import json
from io import BytesIO

# Load environment variables from .env file
env_path = Path(__file__).parent / '.env'
if env_path.exists():
    load_dotenv(env_path)
else:
    # Try loading from project root
    load_dotenv()

# Force reload of audit module
import importlib
import app.services.audit
importlib.reload(app.services.audit)

from app.schemas import AuditResponse, AuditItem
from app.services.ingestion import initialize_vector_store, get_available_models
from app.services.database import (
    store_audit_result, 
    get_latest_audit, 
    get_all_audits, 
    get_audit_by_id,
    convert_audit_doc_to_response
)
from app.services.audit import extract_text_from_pdf, extract_policy_rules, run_full_audit, validate_policy_document
from app.services.dashboard import calculate_dashboard_stats, generate_excel_report


# Global vector store instance
vectorstore = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup and shutdown events.
    Initialize vector store on startup.
    """
    global vectorstore
    
    print("\n" + "="*60)
    print("🚀 Policy Sentinel Backend Starting...")
    print("="*60 + "\n")
    
    # Check for Groq API key
    if not os.getenv("GROQ_API_KEY"):
        print("⚠️  WARNING: GROQ_API_KEY environment variable not set!")
        print("   Set it with: $env:GROQ_API_KEY='your-key-here' (PowerShell)")
        print("   Get your free key at: https://console.groq.com/keys")
    
    # Initialize vector store
    try:
        vectorstore = initialize_vector_store(force_reload=False)
        models = get_available_models(vectorstore)
        print(f"\n📊 Available models: {', '.join(models)}\n")
    except Exception as e:
        print(f"❌ Error initializing vector store: {e}")
        print("   Make sure data/model_docs/ contains .txt files")
    
    print("✅ Server ready!\n")
    
    yield
    
    print("\n🛑 Shutting down...")


# Initialize FastAPI app
app = FastAPI(
    title="Policy Sentinel API",
    description="Evidence-Based AI Model Compliance Auditing",
    version="1.0.0",
    lifespan=lifespan
)


# CORS middleware - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "online",
        "service": "Policy Sentinel",
        "version": "1.0.0"
    }


@app.post("/validate")
async def validate_policy(
    policy_file: UploadFile = File(..., description="Policy document (PDF)")
):
    """
    Validate if uploaded document is a policy before running full analysis.
    Returns validation result with reasoning.
    """
    if not policy_file.filename.endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported"
        )
    
    try:
        # Extract text
        pdf_bytes = await policy_file.read()
        policy_text = extract_text_from_pdf(pdf_bytes)
        
        if not policy_text or len(policy_text) < 100:
            raise HTTPException(
                status_code=400,
                detail="PDF appears to be empty or unreadable"
            )
        
        # Validate
        validation_result = validate_policy_document(policy_text)
        
        return {
            "filename": policy_file.filename,
            "is_policy": validation_result["is_policy"],
            "reasoning": validation_result["reasoning"],
            "text_length": len(policy_text)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Validation failed: {str(e)}"
        )


@app.get("/models")
async def list_models():
    """Get list of available models in the vector store."""
    if vectorstore is None:
        raise HTTPException(status_code=500, detail="Vector store not initialized")
    
    models = get_available_models(vectorstore)
    return {
        "models": models,
        "count": len(models)
    }


@app.post("/analyze", response_model=AuditResponse)
async def analyze_policy(
    policy_file: UploadFile = File(..., description="Policy document (PDF)")
):
    """
    Analyze AI models against uploaded policy document.
    
    This endpoint:
    1. Extracts text from the uploaded PDF
    2. Uses Groq to extract 15 compliance rules
    3. Audits all models against all rules using RAG + Groq
    4. Returns structured audit results with evidence
    """
    if vectorstore is None:
        raise HTTPException(
            status_code=500,
            detail="Vector store not initialized. Check server logs."
        )
    
    # Validate file type
    if not policy_file.filename.endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported"
        )
    
    try:
        # Step 1: Extract PDF text
        print(f"\n📄 Processing policy: {policy_file.filename}")
        pdf_bytes = await policy_file.read()
        policy_text = extract_text_from_pdf(pdf_bytes)
        
        if not policy_text or len(policy_text) < 100:
            raise HTTPException(
                status_code=400,
                detail="PDF appears to be empty or unreadable"
            )
        
        # Step 2: Validate if document is actually a policy
        print("🔍 Validating policy document...")
        validation_result = validate_policy_document(policy_text)
        
        if not validation_result["is_policy"]:
            raise HTTPException(
                status_code=400,
                detail=f"Document does not appear to be a policy document. Reason: {validation_result['reasoning']}"
            )
        
        print(f"✅ Policy validation passed: {validation_result['reasoning']}")
        
        # Step 3: Extract rules from policy
        print("🔍 Extracting compliance rules...")
        rules = extract_policy_rules(policy_text)
        
        if not rules:
            raise HTTPException(
                status_code=500,
                detail="Failed to extract rules from policy"
            )
        
        # Step 4: Get available models
        model_names = get_available_models(vectorstore)
        
        if not model_names:
            raise HTTPException(
                status_code=500,
                detail="No models found in vector store"
            )
        
        # Step 5: Run the audit
        print("🔬 Running audit...")
        audit_results = run_full_audit(vectorstore, model_names, rules)
        
        # Step 6: Build response
        response = AuditResponse(
            policy_name=policy_file.filename,
            total_rules=len(rules),
            total_models=len(model_names),
            rules=rules,
            audit_results=audit_results
        )
        
        # Store in MongoDB
        try:
            audit_id = store_audit_result(response)
            print(f"💾 Stored audit in MongoDB with ID: {audit_id}")
        except Exception as e:
            print(f"⚠️  Failed to store audit: {str(e)}")
        
        print(f"✅ Audit complete: {len(audit_results)} results returned\n")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error during analysis: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@app.post("/analyze/stream")
async def analyze_policy_stream(
    policy_file: UploadFile = File(..., description="Policy document (PDF)")
):
    """
    Analyze AI models against uploaded policy document with real-time streaming.
    
    Returns Server-Sent Events (SSE) with progress updates as each audit completes.
    Event types: 'progress', 'result', 'complete', 'error'
    """
    if vectorstore is None:
        raise HTTPException(
            status_code=500,
            detail="Vector store not initialized. Check server logs."
        )
    
    if not policy_file.filename.endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported"
        )
    
    # Read file immediately to avoid file closure issues
    pdf_bytes = await policy_file.read()
    filename = policy_file.filename
    
    async def event_generator():
        try:
            # Step 1: Extract PDF
            yield {
                "event": "progress",
                "data": json.dumps({
                    "stage": "extraction",
                    "message": f"Extracting text from {filename}..."
                })
            }
            
            policy_text = extract_text_from_pdf(pdf_bytes)
            
            if not policy_text or len(policy_text) < 100:
                yield {
                    "event": "error",
                    "data": json.dumps({"error": "PDF appears to be empty or unreadable"})
                }
                return
            
            # Step 2: Validate policy document
            yield {
                "event": "progress",
                "data": json.dumps({
                    "stage": "validation",
                    "message": "Validating policy document..."
                })
            }
            
            validation_result = validate_policy_document(policy_text)
            
            if not validation_result["is_policy"]:
                yield {
                    "event": "error",
                    "data": json.dumps({
                        "error": f"Document does not appear to be a policy. {validation_result['reasoning']}"
                    })
                }
                return
            
            yield {
                "event": "progress",
                "data": json.dumps({
                    "stage": "validation_passed",
                    "message": f"✓ {validation_result['reasoning']}"
                })
            }
            
            # Step 3: Extract rules
            yield {
                "event": "progress",
                "data": json.dumps({
                    "stage": "rules",
                    "message": "Extracting compliance rules..."
                })
            }
            
            rules = extract_policy_rules(policy_text)
            
            if not rules:
                yield {
                    "event": "error",
                    "data": json.dumps({"error": "Failed to extract rules from policy"})
                }
                return
            
            yield {
                "event": "progress",
                "data": json.dumps({
                    "stage": "rules_extracted",
                    "message": f"Extracted {len(rules)} compliance rules",
                    "total_rules": len(rules)
                })
            }
            
            # Step 3: Get models
            model_names = get_available_models(vectorstore)
            total_audits = len(model_names) * len(rules)
            
            yield {
                "event": "progress",
                "data": json.dumps({
                    "stage": "audit_start",
                    "message": f"Auditing {len(model_names)} models against {len(rules)} rules",
                    "total_models": len(model_names),
                    "total_rules": len(rules),
                    "total_audits": total_audits
                })
            }
            
            # Step 4: Run audits with progress updates
            audit_results = []
            completed = 0
            
            for model_idx, model in enumerate(model_names, 1):
                for rule_idx, rule in enumerate(rules, 1):
                    # Send "checking" progress before audit
                    yield {
                        "event": "progress",
                        "data": json.dumps({
                            "stage": "auditing",
                            "message": f"Checking rule {rule_idx}/{len(rules)} for {model}",
                            "model": model,
                            "model_number": model_idx,
                            "total_models": len(model_names),
                            "rule_number": rule_idx,
                            "total_rules": len(rules),
                            "rule_category": rule.category
                        })
                    }
                    
                    # Import audit function here to get evidence
                    from app.services.audit import audit_model_against_rule
                    
                    evidence = audit_model_against_rule(vectorstore, model, rule)
                    audit_item = {
                        "model_name": model,
                        "rule": rule.dict(),
                        "evidence": evidence.dict()
                    }
                    audit_results.append(audit_item)
                    completed += 1
                    
                    # Send result update after audit
                    yield {
                        "event": "result",
                        "data": json.dumps({
                            "model": model,
                            "rule_id": rule.id,
                            "rule_category": rule.category,
                            "rule_question": rule.question,
                            "status": evidence.status,
                            "completed": completed,
                            "total": total_audits,
                            "progress": round((completed / total_audits) * 100, 1)
                        })
                    }
            
            # Step 5: Store audit results in MongoDB
            audit_response = AuditResponse(
                policy_name=filename,
                total_rules=len(rules),
                total_models=len(model_names),
                rules=rules,
                audit_results=[AuditItem(**item) for item in audit_results]
            )
            
            stored_id = store_audit_result(audit_response)
            
            # Step 6: Send final complete event
            yield {
                "event": "complete",
                "data": json.dumps({
                    "policy_name": filename,
                    "total_rules": len(rules),
                    "total_models": len(model_names),
                    "total_audits": len(audit_results),
                    "audit_id": str(stored_id),
                    "message": "Audit complete!"
                })
            }
            
        except Exception as e:
            yield {
                "event": "error",
                "data": json.dumps({"error": str(e)})
            }
    
    return EventSourceResponse(event_generator())


@app.get("/dashboard")
async def get_dashboard():
    """
    Get compliance dashboard statistics from the latest audit.
    
    Returns overall compliance, model rankings, and category breakdown.
    """
    try:
        # Get latest audit from MongoDB
        audit_doc = get_latest_audit()
        
        if not audit_doc:
            raise HTTPException(
                status_code=404,
                detail="No audit results found. Please run an analysis first."
            )
        
        # Convert to AuditResponse
        audit_response = convert_audit_doc_to_response(audit_doc)
        
        # Calculate dashboard stats
        stats = calculate_dashboard_stats(
            audit_response.audit_results,
            audit_response.rules
        )
        
        # Extract unique model names from audit results
        models_analyzed = list(set(item.model_name for item in audit_response.audit_results))
        
        return {
            "audit_id": audit_doc["_id"],
            "policy_name": audit_response.policy_name,
            "total_models": audit_response.total_models,
            "models_analyzed": models_analyzed,
            "timestamp": audit_doc.get("timestamp", ""),
            **stats
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate dashboard: {str(e)}"
        )


@app.post("/export")
async def export_audit_report(audit_response: AuditResponse):
    """
    Export audit results as an Excel file.
    
    Accepts the same AuditResponse object returned from /analyze endpoint.
    Returns downloadable Excel file with multiple sheets.
    """
    try:
        # Calculate dashboard stats
        stats = calculate_dashboard_stats(
            audit_response.audit_results,
            audit_response.rules
        )
        
        # Generate Excel report
        excel_bytes = generate_excel_report(
            audit_response.policy_name,
            audit_response.rules,
            audit_response.audit_results,
            stats
        )
        
        # Return as downloadable file
        return StreamingResponse(
            BytesIO(excel_bytes.getvalue()),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=audit_report_{audit_response.policy_name.replace('.pdf', '')}.xlsx"
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating report: {str(e)}"
        )


@app.get("/audits")
async def list_audits(limit: int = 10, skip: int = 0):
    """
    Get list of previous audit results with pagination.
    
    Query parameters:
    - limit: Maximum number of results (default: 10)
    - skip: Number of results to skip for pagination (default: 0)
    """
    try:
        audits = get_all_audits(limit=limit + skip)[skip:]
        
        # Return summary info
        audit_summaries = []
        for audit in audits:
            models_analyzed = list(set([
                item["model_name"] 
                for item in audit["audit_results"]
            ]))
            
            audit_summaries.append({
                "id": audit["_id"],
                "policy_name": audit["policy_name"],
                "total_rules": audit["total_rules"],
                "total_models": audit["total_models"],
                "models_analyzed": models_analyzed,
                "timestamp": audit.get("timestamp", ""),
                "created_at": audit["created_at"].isoformat() if "created_at" in audit else ""
            })
        
        return {
            "total": len(audits),
            "limit": limit,
            "skip": skip,
            "audits": audit_summaries
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching audits: {str(e)}"
        )


@app.get("/audits/{audit_id}")
async def get_audit_details(audit_id: str):
    """
    Get detailed results for a specific audit by ID with dashboard stats.
    Returns the same format as /dashboard but for a specific audit.
    """
    try:
        audit_doc = get_audit_by_id(audit_id)
        
        if not audit_doc:
            raise HTTPException(
                status_code=404,
                detail="Audit not found"
            )
        
        # Convert to AuditResponse
        audit_response = convert_audit_doc_to_response(audit_doc)
        
        # Calculate dashboard stats for this specific audit
        stats = calculate_dashboard_stats(
            audit_response.audit_results,
            audit_response.rules
        )
        
        # Extract unique model names
        models_analyzed = list(set(item.model_name for item in audit_response.audit_results))
        
        return {
            "_id": str(audit_doc["_id"]),
            "audit_id": str(audit_doc["_id"]),
            "policy_name": audit_response.policy_name,
            "total_rules": audit_response.total_rules,
            "total_models": audit_response.total_models,
            "models_analyzed": models_analyzed,
            "timestamp": audit_doc.get("timestamp", ""),
            "rules": [rule.model_dump() for rule in audit_response.rules],
            "audit_results": [item.model_dump() for item in audit_response.audit_results],
            **stats
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching audit: {str(e)}"
        )


@app.get("/stats")
async def get_overall_stats():
    """
    Get overall statistics across all audits.
    
    Returns aggregated metrics: total audits run, average compliance rates, etc.
    """
    try:
        all_audits = get_all_audits(limit=100)
        
        if not all_audits:
            return {
                "total_audits": 0,
                "total_models_audited": 0,
                "total_rules_checked": 0,
                "average_compliance_rate": 0,
                "recent_audits": []
            }
        
        total_pass = 0
        total_fail = 0
        total_na = 0
        models_set = set()
        rules_set = set()
        
        for audit in all_audits:
            for item in audit["audit_results"]:
                models_set.add(item["model_name"])
                rules_set.add(item["rule_id"])
                
                status = item["evidence"]["status"]
                if status == "PASS":
                    total_pass += 1
                elif status == "FAIL":
                    total_fail += 1
                else:
                    total_na += 1
        
        total_evaluated = total_pass + total_fail
        avg_compliance = (total_pass / total_evaluated * 100) if total_evaluated > 0 else 0
        
        # Recent audits summary
        recent = []
        for audit in all_audits[:5]:
            models = list(set([item["model_name"] for item in audit["audit_results"]]))
            recent.append({
                "id": audit["_id"],
                "policy_name": audit["policy_name"],
                "timestamp": audit.get("timestamp", ""),
                "models": models
            })
        
        return {
            "total_audits": len(all_audits),
            "total_models_audited": len(models_set),
            "total_rules_checked": len(rules_set),
            "average_compliance_rate": round(avg_compliance, 1),
            "total_checks": total_pass + total_fail + total_na,
            "total_pass": total_pass,
            "total_fail": total_fail,
            "total_na": total_na,
            "recent_audits": recent
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating stats: {str(e)}"
        )


@app.post("/compare")
async def compare_models(model_names: list[str] = None):
    """
    Compare specific models from the latest audit.
    
    Request body:
    - model_names: List of model names to compare (optional, defaults to all)
    """
    try:
        # Get latest audit
        audit_doc = get_latest_audit()
        
        if not audit_doc:
            raise HTTPException(
                status_code=404,
                detail="No audit results found"
            )
        
        audit_response = convert_audit_doc_to_response(audit_doc)
        
        # Filter by model names if provided
        if model_names:
            filtered_results = [
                item for item in audit_response.audit_results
                if item.model_name in model_names
            ]
        else:
            filtered_results = audit_response.audit_results
        
        # Group by model
        comparison = {}
        for item in filtered_results:
            if item.model_name not in comparison:
                comparison[item.model_name] = {
                    "pass": 0,
                    "fail": 0,
                    "na": 0,
                    "results": []
                }
            
            status = item.evidence.status
            comparison[item.model_name][status.lower()] += 1
            comparison[item.model_name]["results"].append({
                "rule_id": item.rule_id,
                "rule_question": item.rule_question,
                "category": item.rule_category,
                "status": status,
                "quote": item.evidence.quote,
                "reason": item.evidence.reason
            })
        
        # Calculate scores
        for model_name in comparison:
            total_evaluated = comparison[model_name]["pass"] + comparison[model_name]["fail"]
            if total_evaluated > 0:
                comparison[model_name]["compliance_score"] = round(
                    comparison[model_name]["pass"] / total_evaluated * 100, 1
                )
            else:
                comparison[model_name]["compliance_score"] = 0
        
        return {
            "policy_name": audit_response.policy_name,
            "comparison": comparison
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error comparing models: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
