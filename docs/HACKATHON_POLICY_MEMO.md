================================================================================
POLICY MEMO TO NIST AI SAFETY INSTITUTE
Strengthening AI Documentation Transparency Through Automation
================================================================================

TO: Elizabeth Kelly, Director, U.S. AI Safety Institute (NIST)  
FROM: Policy Sentinel Team  
DATE: November 23, 2025  
SUBJECT: Proposal: Automated Pre-Audit System for AI Model Compliance

================================================================================
EXECUTIVE SUMMARY
================================================================================

THE CHALLENGE  
The number of advanced AI systems entering the market continues to accelerate.
However, documentation such as model cards and system cards remains largely
unstructured, narrative-based, and difficult to evaluate consistently. As a
result, verifying policy alignment and safety measures before deployment into
critical systems remains impractical at scale.

OUR CONTRIBUTION  
To assess this gap, we built **Policy Sentinel**, an automated RAG-based auditing
engine. Using publicly available documentation from seven leading AI models
(e.g., GPT-4, Claude 3, Gemini 1.5, Llama 3+), we analyzed **742 documentation
segments** aligned with NIST AI RMF core categories.

Key evaluation outcomes (based on our scoring rubric):

- **58.9%** of documentation contained statements that could not be confidently
  verified.
- Some categories, such as privacy and ethical safeguards, lacked sufficient
  detail to enable machine-readable verification.
- Only **33.9%** of reviewed compliance assertions met our verification threshold
  (≥70% confidence score).

THE OPPORTUNITY  
A standardized, machine-readable format for compliance documentation—paired with
automated verification—could reduce regulatory review workload, improve
comparability across models, and establish transparent minimum expectations for
AI systems used in federal environments.

================================================================================
THE PROBLEM: MEASUREMENT GAP
================================================================================

## Current State: Manual, Narrative, and Inconsistent

Examples of publicly available documentation today:

- OpenAI GPT-4 System Card — >50 pages of prose
- Anthropic Claude Model Card — unstructured bullet points
- Meta Llama documentation — distributed across repositories and blog posts

This makes it difficult for regulators to:

- Compare documentation across models
- Identify missing or incomplete safety details
- Validate claims without extensive expert review
- Scale evaluation as the model landscape grows

## Empirical Signal from Testing

Using our evaluation pipeline against NIST RMF-aligned categories, the following
pattern emerged:

| Category                    | Pass Rate      | Avg Confidence     |
| --------------------------- | -------------- | ------------------ |
| Performance Metrics         | 100%           | 89.6% ✓            |
| Capabilities & Use Cases    | 86%            | 87.8% ✓            |
| Safety / Risk Assessment    | 71%            | 84.3% ✓            |
| Training Data Documentation | 43%            | 36.2% ⚠            |
| Limitations                 | 14%            | 7.1% ✗             |
| Usage Policies              | 14%            | 7.1% ✗             |
| Ethical Considerations      | _Low coverage_ | _Low confidence_ ✗ |
| Privacy & Data Protection   | _Low coverage_ | _Low confidence_ ✗ |

> Note: These results reflect the evaluation criteria and scoring rubric used in
> the Policy Sentinel system. Raw scoring methodology is available in the Appendix.

No model achieved full category-level verification.

================================================================================
PROPOSED SOLUTION: SENTINEL STANDARD
================================================================================

We recommend piloting a standardized, machine-readable compliance framework based
on the Policy Sentinel workflow.

## Sentinel Workflow (3-Stage Pipeline)

**STEP 1 — INGEST**

- Vendors upload documentation (PDF, JSON, or machine-readable system card).
- Claims are parsed, indexed, and tagged with metadata.

**STEP 2 — VERIFY**

- A verification engine cross-references claims with policy requirements.
- Each compliance statement receives a confidence score:

| Score Range | Interpretation               |
| ----------- | ---------------------------- |
| 80–100%     | Strong explicit evidence     |
| 50–79%      | Partial or indirect evidence |
| 20–49%      | Insufficient evidence        |
| 0–19%       | No verifiable evidence found |

**STEP 3 — CERTIFY**

- Passing models undergo brief human review.
- Failing reports include actionable documentation gaps and resubmission guidance.

## Expected Outcomes

- **Efficiency:** Estimated evaluation time per model: ~30–90 seconds
- **Scalability:** Supports high-volume model reviews
- **Equity:** Open-source approach lowers compliance barrier for smaller labs
- **Consistency:** Enables comparative scoring across model families

================================================================================
POLICY RECOMMENDATIONS
================================================================================

## 90-Day Pilot Pathway

1. **Pilot (Days 1–30)**

   - Invite ~5 volunteer model providers to submit documentation in the proposed format
   - Publish non-binding transparency scorecards

2. **Rulemaking Framework (Days 31–60)**

   - Explore integration into relevant procurement rules (e.g., FAR update)
   - Establish a provisional documentation minimum threshold

3. **Operationalization (Days 61–90)**
   - Release implementation guidance and reference schema
   - Open API access for third-party auditors

## Long-Term Vision: A Standardized “Model Transparency Card”

A concise, machine-readable document analogous to nutrition or emissions labels
could support:

- Public trust
- Procurement assessment
- Cross-model comparison

================================================================================
CONCLUSION
================================================================================

As AI systems continue to evolve rapidly, documentation transparency remains a
foundational requirement for responsible deployment—particularly in public-sector
applications. Our testing demonstrates that automated verification can meaningfully
reduce review time, highlight missing information, and operationalize alignment
expectations.

A phased pilot will allow NIST and industry stakeholders to refine criteria,
validate methodology, and assess feasibility before considering broader adoption.

We welcome the opportunity to support that process.

================================================================================
APPENDIX
================================================================================

## Evaluation Method Summary

- Framework: NIST AI RMF category alignment
- Corpus: 742 documentation segments extracted from seven publicly available
  model documentation sources
- Processing Pipeline: RAG (LangChain + ChromaDB)
- Scoring Model: Groq llama-3.3-70b-versatile
- Full methodology and reproducibility materials available upon request.

## Contact

Email: team@policysentinel.ai  
Demo Access: policy-sentinel.demo.app

================================================================================
END OF MEMO
================================================================================
