"""
Pydantic models for Policy Sentinel API
"""
from typing import List, Literal
from pydantic import BaseModel, Field


class Rule(BaseModel):
    """A single compliance rule extracted from the policy document."""
    id: str = Field(..., description="Unique rule identifier (e.g., '1', '2')")
    category: str = Field(..., description="Rule category (e.g., 'Safety', 'Transparency')")
    question: str = Field(..., description="The yes/no compliance question")


class Evidence(BaseModel):
    """Evidence retrieved from model documentation."""
    status: Literal["PASS", "FAIL"] = Field(..., description="Compliance status")
    confidence: float = Field(..., description="Confidence score (0-100%) for the status")
    quote: str = Field(..., description="Exact quote from the model documentation")
    reason: str = Field(..., description="One-sentence explanation for the status")


class AuditItem(BaseModel):
    """Audit result for one model against one rule."""
    model_name: str = Field(..., description="Name of the AI model")
    rule_id: str = Field(..., description="ID of the rule being audited")
    rule_question: str = Field(..., description="The compliance question")
    rule_category: str = Field(..., description="Category of the rule")
    evidence: Evidence = Field(..., description="Evidence and compliance status")


class AuditResponse(BaseModel):
    """Complete audit response for all models against all rules."""
    policy_name: str = Field(default="Uploaded Policy", description="Name of the policy document")
    total_rules: int = Field(..., description="Total number of rules extracted")
    total_models: int = Field(..., description="Total number of models audited")
    rules: List[Rule] = Field(..., description="All extracted rules")
    audit_results: List[AuditItem] = Field(..., description="Complete audit matrix")
