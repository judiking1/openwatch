# Concept generator kit

From an idea to a running concept in four steps. The in-app **Concept Lab** (`#/lab/concept`)
runs steps 1–2 in the browser: it writes the prompt from this kit's own template and schema,
validates the pasted answer with the same validator as the CLI, and sketches the encoding
live (each encoded unit drawn with the primitive its variable suggests). Nothing is sent
anywhere; the visitor uses any LLM.

1. **Spec** — write or generate a JSON spec with [`prompt.md`](prompt.md). The format is
   [`concept-spec.schema.json`](concept-spec.schema.json): metadata, how each unit of time is
   encoded, the difference axes it occupies, precedents with verdicts, colour fields and a
   sound profile. [`example-spec.json`](example-spec.json) mirrors watch 012 Iris.
2. **Scaffold** — `npm run new-concept -- spec.json` (add `--dry-run` to preview). It writes
   `src/watches/<id>/` (metadata, appearance, index, a math file with a test, and a placeholder
   model with named hour / minute / second hands), `docs/concepts/<id>.md` with the encoding and
   precedent tables, and registers the concept in the exhibition. It refuses to overwrite
   files and rejects specs with a precedent marked "same".
3. **Build** — replace the placeholder math and model with the real encoding (`AGENTS.md`,
   "Adding a watch concept").
4. **Review** — the checklist at the end of `prompt.md`.

The scaffold logic is `scripts/conceptScaffold.mjs` (pure, unit-tested in
`scripts/conceptScaffold.test.ts`); the generated code compiles, lints and passes its own test
as generated.
