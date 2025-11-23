# Data Ingestion and Indexing Pipeline

---

## Project Component Description: Data Ingestion and Indexing Pipeline

| **Detail** | **Description** |
| --- | --- |
| **Component Name** | Data Ingestion and Indexing Pipeline (The "Scraper/Parser") |
| **Primary Objective** | To convert fragmented, multi-format AI model documentation into a unified, structured, and machine-readable vector database for automated compliance auditing. |
| **Policy Objective** | To demonstrate that AI documentation, regardless of its original format, can be made **machine-readable** and **verifiable**, thus solving the problem of "fragmented and confusing" documentation2. |
| **Required Output** | A single, unified **Vector Embedding Store** containing all extracted text, tagged with original metadata (Model, Company, Document Type, and original Source File/URL/Page Number). |

---

### 1. Source Data: What We Are Scraping/Parsing

To prove the system works against the real-world fragmentation problem3, we will focus our effort on a **Hybrid Selection of 7 key documents** spanning diverse companies and file formats.

---

| **Company** | **Model(s)** | **Model Type** | **Documentation Type/URL** |
| --- | --- | --- | --- |
| **OpenAI** | GPT-4, GPT-4o | Closed API | <https://cdn.openai.com/papers/gpt-4-system-card.pdf> |
| **OpenAI** | GPT-4, GPT-4o | Closed API | <https://openai.com/index/hello-gpt-4o/> |
| **OpenAI** | GPT-4 | Closed API | <https://cdn.openai.com/papers/gpt-4-system-card.pdf> |
| **OpenAI** | GPT-4 | Closed API | <https://arxiv.org/abs/2303.08774> |
| **OpenAI** | GPT-4V (Vision) | Closed API | <https://arxiv.org/abs/2303.08774> |
| **OpenAI** | GPT-4 Turbo | Closed API | <https://platform.openai.com/docs/models/gpt-4-turbo-and-gpt-4> |
| **OpenAI** | GPT-4o | Closed API | <https://openai.com/index/gpt-4o-system-card/> |
| **OpenAI** | GPT-4o | Closed API | <https://cdn.openai.com/gpt-4o-system-card.pdf> |
| **OpenAI** | GPT-4o | Closed API | <https://arxiv.org/abs/2410.21276> |
| **OpenAI** | GPT-4o mini | Closed API | <https://platform.openai.com/docs/models/gpt-4o-mini> |
| **OpenAI** | GPT-3.5 Turbo | Closed API | <https://platform.openai.com/docs/models/gpt-3-5-turbo> |
| **OpenAI** | GPT-3 | Closed API | <https://github.com/openai/gpt-3/blob/master/model-card.md> |
| **OpenAI** | o1 | Closed API | <https://openai.com/index/openai-o1-system-card/> |
| **OpenAI** | o1 | Closed API | <https://cdn.openai.com/o1-system-card-20241205.pdf> |
| **OpenAI** | o1 | Closed API | <https://arxiv.org/abs/2412.16720> |
| **OpenAI** | o1-preview | Closed API | <https://cdn.openai.com/o1-system-card.pdf> |
| **OpenAI** | o1-preview | Closed API | <https://assets.ctfassets.net/kftzwdyauwt9/67qJD51Aur3eIc96iOfeOP/71551c3d223cd97e591aa89567306912/o1_system_card.pdf> |
| **OpenAI** | GPT-5 | Closed API | <https://openai.com/index/gpt-5-system-card/> |
| **OpenAI** | DALL-E 3 | Closed API | <https://github.com/openai/whisper/blob/main/model-card.md> |
| **OpenAI** | DALL-E 3 | Closed API | <https://arxiv.org/abs/2212.04356> |
| **Anthropic** | Claude 3.5 Sonnet, Claude Opus | Closed API | <https://openai.com/index/whisper/> |
| **Google DeepMind** | Gemini 1.5 Pro | Closed API | <https://huggingface.co/openai/whisper-large-v3> |
| **Google DeepMind** | Gemini 1.5 Pro | Closed API | <https://cdn.openai.com/papers/DALL_E_3_System_Card.pdf> |
| **Meta** | Llama 3.1 (8B, 70B, 405B) | Open-weight | <https://www-cdn.anthropic.com/de8ba9b01c9ab7cbabf5c33b80b7bbc618857627/Model_Card_Claude_3.pdf> |
| **Meta** | Llama 3.1 (8B, 70B, 405B) | Open-weight | <https://arxiv.org/abs/2403.05530> |
| **Mistral AI** | Mixtral 8x7B, Mistral Large | Mixed (some open) | <https://ai.google.dev/gemini-api/docs/models/gemini> |
| **Mistral AI** | Mixtral 8x7B, Mistral Large | Mixed (some open) | <https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/MODEL_CARD.md> |
| **xAI** | Grok-1, Grok-2 | Partially open | <https://arxiv.org/abs/2407.21783> |
| **xAI** | Grok-1, Grok-2 | Partially open | <https://docs.mistral.ai/> |
| **Stability AI** | Stable Diffusion 3 | Open-weight | <https://mistral.ai/news/> |
| **Stability AI** | Stable Diffusion 3 | Open-weight | <https://github.com/xai-org/grok-1> |
| **Cohere** | Command R+, Command | Closed API | <https://x.ai/> |
| **Cohere** | Command R+, Command | Closed API | <https://stability.ai/news/stable-diffusion-3> |
| **AI21 Labs** | Jamba 1.5 | Open-weight | <https://huggingface.co/stabilityai/stable-diffusion-3-medium> |
| **AI21 Labs** | Jamba 1.5 | Open-weight | <https://cdn.openai.com/papers/DALL_E_3_System_Card.pdf> |
| **Alibaba** | Qwen 2.5 | Open-weight | <https://docs.cohere.com/docs/command-r-plus> |
| **Alibaba** | Qwen 2.5 | Open-weight | <https://docs.cohere.com/> |
|  |  |  | <https://www.ai21.com/blog/announcing-jamba> |
|  |  |  | <https://huggingface.co/ai21labs> |
|  |  |  | <https://github.com/QwenLM/Qwen2.5> |
|  |  |  | <https://qwenlm.github.io/> |

### 2. The Scraping/Parsing/Crawling Process in Detail

The process moves through three critical phases to convert messy source files into usable data:

### Phase A: Crawling/Fetching (Gathering the Raw Data)

1.

    **Input:** A list of the 7 source URLs/File Paths (derived from the provided CSV 7).

2.

    **Action:** Utilize specialized libraries (e.g., Python's `requests` for web content, PDF parsers for PDFs) to fetch the raw data8.

3.

    **Challenge Addressed:** This addresses the initial hurdle of documents being scattered across multiple platforms and formats (web, PDF, GitHub)9.

### Phase B: Parsing and Cleaning (Structuring the Unstructured)

1. **Input:** Raw text content from the 7 source documents.
2. **Action:**
    - **Text Cleaning:** Remove headers, footers, boilerplate, and irrelevant captions to isolate core information.
    - **Section Chunking:** Divide the long documents (like 100+ page System Cards) into smaller, semantically meaningful text chunks (e.g., a few sentences or a short paragraph). **Crucially, each chunk must retain its original citation metadata (Model, Source Document Title, and Page/Section).**
3.

    **Challenge Addressed:** This solves the issue of finding information buried in "lengthy or fragmented materials" 10 and prepares the data for effective Retrieval-Augmented Generation (RAG).

### Phase C: Indexing and Embedding (Creating the Machine-Readable Output)

1. **Input:** The cleaned, chunked text, along with its metadata.
2. **Action:**
    - **Vector Embedding:** Use a pre-trained language model to convert each text chunk into a high-dimensional numerical vector (embedding).
    - **Index Storage:** Store all vectors in a **Vector Database** (the "Embedding Store").
3.

    **Required Output (Final Deliverable):** A single, unified index where a policy question (e.g., "Does the model disclose its red teaming attack success rates?") 11 can be used to efficiently retrieve the most relevant text chunk (the evidence), along with the necessary citation metadata (Model, Document Title).

---

### 3. Required Output for the Auditing Engine (What We Need)

The final output of the pipeline must be a machine-readable format that allows the Policy Sentinel to operate.

- **Format:** A queryable **Vector Database Index**.
- **Purpose:** To serve as the comprehensive, unified knowledge base for the **RAG Auditing Engine**.

The database must support the extraction of information for the **5 Policy Categories** identified in the provided documentation12:

1.

    **Safety & Risk Information** (e.g., Red teaming attack success rates, Known failure modes) 13

2.

    **Intended Use & Limitations** (e.g., Known demographic biases, Explicit intended use cases) 14

3.

    **Training & Data** (e.g., Data filtering/curation methods, Synthetic data usage) 15

4.

    **Performance & Capabilities** (e.g., Benchmark scores on standard evals, Capability jumps) 16

5. **Organizational & Governance** (e.g., Third-party audits, Model update/deprecation policy) 17
