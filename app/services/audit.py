"""
Audit service for Policy Sentinel.
Handles policy extraction and model compliance auditing using Groq.
"""
import json
import re
import os
from typing import List, Dict
from pypdf import PdfReader
from groq import Groq
from langchain_community.vectorstores import Chroma

from app.schemas import Rule, Evidence, AuditItem


def call_groq(prompt: str) -> str:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable not set")
    
    client = Groq(api_key=api_key)
    
    chat_completion = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama-3.3-70b-versatile",
        temperature=0.1,
        max_tokens=2048,
    )
    
    return chat_completion.choices[0].message.content



def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Extract text content from uploaded PDF bytes.
    """
    from io import BytesIO
    
    pdf_file = BytesIO(pdf_bytes)
    reader = PdfReader(pdf_file)
    
    text_parts = []
    for page in reader.pages:
        text_parts.append(page.extract_text())
    
    full_text = "\n\n".join(text_parts)
    print(f"📄 Extracted {len(full_text)} characters from PDF ({len(reader.pages)} pages)")
    
    return full_text


def validate_policy_document(policy_text: str) -> Dict[str, any]:
    """
    Validate if the uploaded document is actually a policy document.
    
    Returns:
        dict with 'is_policy' (bool) and 'reasoning' (str)
    """
    # Truncate for validation
    sample_text = policy_text[:5000]
    
    prompt = f"""You are a document classifier. Determine if the following document is a POLICY document (e.g., compliance policy, governance policy, data protection policy, AI ethics policy, etc.).

A policy document typically contains:
- Rules, requirements, or guidelines
- Compliance statements
- Governance frameworks
- Standards or procedures
- Regulatory requirements

Document excerpt:
{sample_text}

Return ONLY valid JSON (no markdown) in this exact format:
{{"is_policy": true/false, "reasoning": "brief explanation"}}

JSON Output:"""
    
    try:
        response_text = call_groq(prompt).strip()
        
        # Clean response
        response_text = re.sub(r'^```json\s*', '', response_text)
        response_text = re.sub(r'^```\s*', '', response_text)
        response_text = re.sub(r'\s*```$', '', response_text)
        response_text = response_text.strip()
        
        result = json.loads(response_text)
        return result
        
    except Exception as e:
        print(f"❌ Validation error: {e}")
        # Default to assuming it's a policy if validation fails
        return {"is_policy": True, "reasoning": "Validation check could not be performed, proceeding with analysis"}



def extract_policy_rules(policy_text: str) -> List[Rule]:
    """
    Use Groq to extract 5 yes/no compliance rules from policy text.
    
    Args:
        policy_text: Full text of the policy document
    
    Returns:
        List of Rule objects
    """
    # Truncate policy text if too long (Groq has context limits)
    max_chars = 15000
    truncated_text = policy_text[:max_chars]
    if len(policy_text) > max_chars:
        print(f"⚠️  Policy text truncated to {max_chars} characters")
    
    prompt = f"""You are a policy analysis expert. Extract exactly 5 key binary compliance rules from the following policy document.

Each rule must be:
- A clear yes/no question
- Specific and auditable
- Categorized (Safety, Transparency, Data, Evaluation, Documentation, etc.)

Policy Document:
{truncated_text}

Return ONLY valid JSON (no markdown, no extra text) in this exact format:
[
  {{"id": "1", "category": "Safety", "question": "Does the model document red-teaming results?"}},
  {{"id": "2", "category": "Data", "question": "Is the training data composition disclosed?"}},
  {{"id": "3", "category": "Transparency", "question": "Are model limitations clearly documented?"}},
  {{"id": "4", "category": "Evaluation", "question": "Are benchmark results provided?"}},
  {{"id": "5", "category": "Documentation", "question": "Is there a model card available?"}}
]

JSON Output:"""
    
    try:
        response_text = call_groq(prompt).strip()
        
        # Clean response - remove markdown code blocks if present
        response_text = re.sub(r'^```json\s*', '', response_text)
        response_text = re.sub(r'^```\s*', '', response_text)
        response_text = re.sub(r'\s*```$', '', response_text)
        response_text = response_text.strip()
        
        # Parse JSON
        rules_data = json.loads(response_text)
        
        # Convert to Rule objects
        rules = [Rule(**rule_dict) for rule_dict in rules_data]
        
        print(f"✅ Extracted {len(rules)} compliance rules")
        return rules
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON parsing error: {e}")
        print(f"Response was: {response_text[:500]}")
        # Return fallback rules
        return _get_fallback_rules()
    except Exception as e:
        print(f"❌ Error extracting rules: {e}")
        return _get_fallback_rules()


def _get_fallback_rules() -> List[Rule]:
    """Fallback rules if LLM fails - reduced to 5 rules."""
    return [
        Rule(id="1", category="Safety", question="Does the model document red-teaming or adversarial testing?"),
        Rule(id="2", category="Data", question="Is the training data composition disclosed?"),
        Rule(id="3", category="Transparency", question="Are model limitations clearly documented?"),
        Rule(id="4", category="Evaluation", question="Are benchmark results provided?"),
        Rule(id="5", category="Documentation", question="Is there a model card or system card available?"),
    ]


def audit_model_against_rule(
    vectorstore: Chroma,
    model_name: str,
    rule: Rule,
    top_k: int = 3
) -> Evidence:
    """
    Audit a single model against a single rule.
    
    Args:
        vectorstore: Chroma vector store
        model_name: Name of the model to audit
        rule: Rule to check compliance against
        top_k: Number of chunks to retrieve
    
    Returns:
        Evidence object with status, quote, and reason
    """
    # Retrieve relevant chunks for this model
    try:
        results = vectorstore.similarity_search(
            rule.question,
            k=top_k,
            filter={"model_name": model_name}
        )
        
        if not results:
            return Evidence(
                status="FAIL",
                confidence=20.0,
                quote="No documentation available",
                reason="No documentation found for this model, assuming non-compliance."
            )
        
        # Combine chunks into context
        context = "\n\n---\n\n".join([doc.page_content for doc in results])
        
        # Audit prompt
        prompt = f"""You are a strict compliance auditor. Your job is to determine if the provided model documentation confirms compliance with the given rule.

Rule Question: {rule.question}

Model Documentation Context:
{context[:4000]}

Instructions:
- Determine if the documentation confirms compliance (PASS) or not (FAIL)
- Provide a confidence score (0-100%) based on:
  * 80-100%: Strong explicit evidence clearly confirming or denying compliance
  * 50-79%: Moderate evidence with reasonable inference
  * 20-49%: Weak/indirect evidence or partial information
  * 0-19%: Insufficient information (use FAIL with low confidence)
- Extract a SHORT exact quote (1-2 sentences max) as evidence
- Provide a brief reason (one sentence)

Return ONLY valid JSON (no markdown) in this exact format:
{{"status": "PASS", "confidence": 85.0, "quote": "exact text from context", "reason": "brief explanation"}}

JSON Output:"""
        
        response_text = call_groq(prompt).strip()
        
        # Clean response
        response_text = re.sub(r'^```json\s*', '', response_text)
        response_text = re.sub(r'^```\s*', '', response_text)
        response_text = re.sub(r'\s*```$', '', response_text)
        response_text = response_text.strip()
        
        # Parse JSON
        evidence_data = json.loads(response_text)
        
        # Validate confidence is between 0-100
        if 'confidence' in evidence_data:
            evidence_data['confidence'] = max(0.0, min(100.0, float(evidence_data['confidence'])))
        else:
            evidence_data['confidence'] = 50.0  # Default to 50% if not provided
        
        return Evidence(**evidence_data)
        
    except json.JSONDecodeError as e:
        print(f"⚠️  JSON parse error for {model_name} / rule {rule.id}: {e}")
        return Evidence(
            status="FAIL",
            confidence=10.0,
            quote="Error occurred during analysis",
            reason="Error parsing LLM response."
        )
    except Exception as e:
        print(f"⚠️  Audit error for {model_name} / rule {rule.id}: {e}")
        return Evidence(
            status="N/A",
            quote="",
            reason=f"Error during audit: {str(e)[:100]}"
        )


def run_full_audit(
    vectorstore: Chroma,
    model_names: List[str],
    rules: List[Rule]
) -> List[AuditItem]:
    """
    Run the complete audit: all models against all rules.
    
    Args:
        vectorstore: Chroma vector store
        model_names: List of model names to audit
        rules: List of rules to check
    
    Returns:
        List of AuditItem objects
    """
    audit_results = []
    total_audits = len(model_names) * len(rules)
    current = 0
    
    print(f"🔍 Starting audit: {len(model_names)} models × {len(rules)} rules = {total_audits} checks")
    
    for model_name in model_names:
        for rule in rules:
            current += 1
            print(f"  [{current}/{total_audits}] Auditing {model_name} against rule {rule.id}...")
            
            evidence = audit_model_against_rule(vectorstore, model_name, rule)
            
            audit_item = AuditItem(
                model_name=model_name,
                rule_id=rule.id,
                rule_question=rule.question,
                rule_category=rule.category,
                evidence=evidence
            )
            
            audit_results.append(audit_item)
    
    print(f"✅ Audit complete: {len(audit_results)} results")
    return audit_results
