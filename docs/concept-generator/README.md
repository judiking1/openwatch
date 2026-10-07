# Concept generator kit

From an idea to a running concept in four steps. This is the groundwork for the
"Prompt-to-Watch" lab in `docs/future-concepts-and-features.md` §5.1: the same spec format
can later be produced inside the app.

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
