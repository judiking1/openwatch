# Prompt template — new watch concept

Copy the block below into an LLM session (or give it to an agent with repository access).
Replace the `{…}` placeholders. The answer must be a single JSON object that validates
against `concept-spec.schema.json`; scaffold it with `npm run new-concept -- spec.json`.

```text
You are designing a wristwatch concept for Orbital Watch Lab, an exhibition of genuinely
new ways to show time. The visitor's idea: {IDEA, e.g. "inspired by black-hole accretion
disks"}.

Rules
1. Novelty first. Read the catalogue and difference axes in docs/research/watch-references.md.
   Choose an encoding that occupies an under-used cell (what moves, what about it encodes the
   value, where the reading happens). Do not repeat a rejected idea from that file.
2. Precedent check. Search for existing watches and clocks with the same encoding and list
   the nearest ones with a verdict: "different", "overlaps" or "same". If one is "same",
   change the encoding instead of submitting.
3. Readable in five seconds. A visitor must read hour and minute from the 3D model without
   a manual. Give a one-line readingHint (≤ 110 characters) and 2–4 howToRead lines.
4. Physically honest. Say what is speculative in "experimental". Visual models only — never
   claim manufacturing accuracy.
5. Fits the lab. The watch is built in dial units (dial radius 100) on the shared case and
   crystal; markings are printed white and tinted; hands or their equivalents are groups named
   hour / minute / second. Colours for 2–6 customisable parts go in "appearance".
6. Sound: choose "escapement", "drop", "ratchet" or "quiet".

Answer with JSON only, following this schema: {PASTE concept-spec.schema.json}
Next free number: {e.g. 014}. Today: {YYYY-MM-DD}.
```

## Review checklist (before the concept is merged)

- [ ] Precedents searched and cited; none marked "same".
- [ ] Reading verified at several times, including the hour rollover (see the Angbuilgu and
      Iris reviews for the screenshot method).
- [ ] Time → geometry math in its own file with unit tests.
- [ ] Renders on `?renderer=webgl` and `?renderer=webgpu`; transparent overlays do not write
      depth.
- [ ] `docs/concepts/<id>.md` explains the encoding and any simplifications.
