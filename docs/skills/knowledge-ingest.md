# Skill: knowledge_ingest

## What it does

The "dump files" feature. Upload a workshop PDF, course material, or paste raw notes — the pipeline extracts the text, has Babuu write a summary and pull out actionable takeaways, and embeds the content into master memory so Babuu can recall it in any future conversation.

## Where it lives

- API: `POST /api/knowledge` (multipart file or JSON text), `GET /api/knowledge`
- UI: Knowledge tab (`src/components/dashboard/sections/KnowledgeSection.tsx`)
- Data: `knowledge_documents` table + chunks in `strategy_embeddings`
- Text extraction: `pdf-parse` (PDF), `mammoth` (DOCX), UTF-8 read (TXT/MD)

## Pipeline

1. Extract text from the file (or accept pasted text)
2. Babuu summarizes: 3-5 sentence summary + up to 7 actionable takeaways
3. Row stored in `knowledge_documents` (raw text capped at 500K chars)
4. First 50K chars chunked and embedded via Cohere into `strategy_embeddings`
   with `document_type: knowledge_document`
5. "In memory" badge appears in the UI once embedding succeeds

## Inputs

| Field | Notes |
|---|---|
| file or text | PDF, DOCX, TXT, MD, or pasted text |
| title | Defaults to filename |
| source_type | workshop, course, program, book, article, meeting_notes, other |
| brand_id | Which brand's memory. Studio-wide docs pass null (future) |

## Failure modes

- No Anthropic key: document stores without summary/takeaways (fields empty, not fake)
- No Cohere key: document stores but `embedded: false`; retryable later
- Unextractable file (scanned image PDF): returns 422 with a clear error, nothing stored
- Supabase down: 503 with instructions

## How to verify

Upload a small .txt file in the Knowledge tab. Within seconds the card should show a summary, takeaways, and the green "In memory" badge. Then ask Babuu about the topic — it should cite it.
