# ORBITAL WATCH LAB
## Project Bootstrap & Vision Document

> Working title: **Orbital Watch Lab**
>
> A 3D exhibition and experimentation app for inventing, visualizing, customizing, and eventually exporting unconventional watch concepts.

---

# 1. Why This Project Exists

This project began from a simple question:

> What if a watch did not place the hands at the center?

Traditional analog watches typically share the same structural idea:

- Numbers or markers are arranged around the outside.
- Hour, minute, and second hands are mounted at the center.
- The hands extend outward and rotate to indicate time.

The first concept that triggered this project reverses that relationship.

Instead:

- Time numerals are placed closer to the center.
- Hour, minute, and second indicators travel around the outside.
- Each indicator points inward toward the corresponding numeral or marker.
- The indicators themselves orbit the dial instead of growing outward from a central pivot.

This is not merely a visual theme.

It asks a broader design question:

> How many completely different ways can time be represented on a wristwatch?

The goal of this project is to continuously explore that question.

---

# 2. Project Vision

**Orbital Watch Lab is not a watch configurator for existing watches.**

It is a digital laboratory and exhibition space for watches that may not exist yet.

The app should allow:

1. A human to propose an unusual watch idea.
2. AI agents to generate their own unconventional watch concepts.
3. Each concept to be implemented as an interactive 3D watch.
4. Visitors to browse a growing catalog of experimental watches.
5. Visitors to manipulate certain materials, colors, components, and parameters.
6. Each watch to actually display or animate time according to its own concept.
7. Selected models to eventually be exported in formats such as GLB.

The application should feel somewhere between:

- a virtual watch museum,
- an experimental industrial-design studio,
- a 3D product configurator,
- and a generative design playground.

The long-term goal is to accumulate a collection of watch ideas that are visually interesting, mechanically intriguing, or conceptually novel.

---

# 3. Core Product Philosophy

The project follows several principles.

## 3.1 The idea comes before realism

A concept does not need to be immediately manufacturable.

Interesting ideas may begin as:

- impossible mechanisms,
- speculative mechanical designs,
- optical illusions,
- unusual ways of representing time,
- rotating structures,
- moving numerals,
- orbital indicators,
- transparent layers,
- magnetic-looking indicators,
- architectural dials,
- mechanical sculptures.

The first responsibility of the app is to make those ideas understandable and beautiful.

Mechanical feasibility can be evaluated later.

---

## 3.2 Watches must still represent time

A model should not become only a decorative object.

Whenever possible, every watch concept should answer:

> How does this object communicate hour, minute, and second?

A concept can intentionally omit seconds or reinterpret time, but that decision must be explicit.

Examples:

- rotating hands,
- rotating numerals,
- wandering-hour displays,
- orbiting markers,
- sliding indicators,
- rotating rings,
- apertures,
- discs,
- spheres,
- mechanical shutters,
- light-based indicators,
- layered transparent structures.

---

## 3.3 Every concept should have a story

Each watch should have metadata explaining:

- Concept name
- Core idea
- How to read the time
- Why the design is interesting
- Which parts are experimental
- Whether it is physically plausible
- Which parts were suggested by a human
- Which parts were generated or refined by AI

The collection should feel like an exhibition rather than a list of anonymous 3D assets.

---

# 4. First Watch Concept

Working name:

**Inside Dial / Orbital Hands**

The original concept that started the project.

## Basic rule

Traditional watch:

```text
outer numerals
      ↑
hands extend outward
      ↑
center pivot
```

Orbital Hands watch:

```text
outer orbiting indicators
        ↓
indicators point inward
        ↓
inner numerals / markers
```

## Intended behavior

- Numerals remain fixed.
- Hour indicator travels around an outer circular path.
- Minute indicator travels around an outer circular path.
- Second indicator travels around an outer circular path.
- All indicators point toward the center.
- Indicators may use separate concentric tracks.
- The displayed time must update in real time.
- Manual time control must also be supported for testing.

The first implementation does not need to reproduce a physically buildable watch movement.

The objective is to validate:

- readability,
- visual appeal,
- motion,
- proportions,
- dial layout,
- and the emotional impression of the concept.

---

# 5. Product Experience

A user should eventually be able to enter the app and experience something like this:

```text
WATCH LAB

[ Orbital Hands ]
[ Floating Hour ]
[ Split Orbit ]
[ Mechanical Eclipse ]
[ ... ]

            ↓

Select Watch

            ↓

Interactive 3D Viewer

            ↓

Rotate / Zoom / Inspect

            ↓

Play Real Time
Set Custom Time
Speed Up Time

            ↓

Customize

Case
Dial
Hands / Indicators
Materials
Colors
Crystal
Strap

            ↓

Export Model
```

---

# 6. Main Screens

## 6.1 Exhibition / Gallery

The home screen should eventually show a catalog of experimental watch concepts.

Each card may contain:

- watch thumbnail or realtime preview,
- concept name,
- short description,
- design category,
- creation date,
- human / AI origin label,
- mechanical-feasibility status.

Example categories:

- Orbital
- Wandering Hours
- Disc Display
- Kinetic
- Minimal
- Mechanical Sculpture
- Experimental
- Impossible Concept

---

## 6.2 Watch Viewer

The main 3D experience.

Basic interactions:

- orbit camera,
- zoom,
- reset camera,
- fullscreen,
- pause animation,
- real-time clock,
- manual time selection,
- accelerated time simulation.

The watch should remain interactive rather than being a pre-rendered animation.

---

## 6.3 Customization Panel

The exact customization options should be defined per watch.

Potential parameters:

### Case

- metal
- surface finish
- color
- diameter
- thickness

### Dial

- background material
- color
- transparency
- numeral style

### Indicators

- color
- material
- size
- length
- thickness

### Crystal

- transparent
- tinted
- reflective appearance

### Strap

- leather-like
- fabric-like
- metal bracelet
- color

Not every watch must expose every parameter.

Each concept should declare which properties are safe to customize.

---

# 7. GLB Export

A future high-value feature is model export.

The user should eventually be able to configure a watch and export the currently viewed version.

Preferred first target:

```text
.glb
```

Possible future formats:

```text
.gltf
.obj
.stl
.usdz
```

Important distinction:

**The exported model is initially a visual model, not a manufacturing-ready CAD model.**

The application must not imply that an exported GLB is mechanically accurate or ready for production.

Future projects may later add:

- printable models,
- CAD-compatible geometry,
- manufacturing tolerances,
- movement components.

Those are separate engineering milestones.

---

# 8. Human + AI Concept Generation

A major part of the project is allowing both the user and AI agents to create new watch concepts.

New concepts may originate from:

### Human idea

Example:

> Put the numerals in the center and make all three hands orbit outside them.

### AI idea

Example:

> Create a watch where twelve hour markers slowly rotate while a fixed beam indicates the current hour.

### Collaborative idea

Example:

1. Human proposes the core idea.
2. AI suggests variations.
3. Human chooses one.
4. AI implements it.
5. Another agent reviews usability and visual coherence.
6. The concept is added to the exhibition.

---

# 9. Concept Specification

Every watch concept should eventually have a structured definition.

Possible structure:

```ts
type WatchConcept = {
  id: string;
  name: string;
  description: string;

  origin: {
    type: "human" | "ai" | "collaborative";
    note?: string;
  };

  timeDisplay: {
    hour: boolean;
    minute: boolean;
    second: boolean;
  };

  customizable: {
    case?: boolean;
    dial?: boolean;
    indicators?: boolean;
    crystal?: boolean;
    strap?: boolean;
  };

  exportable: boolean;

  feasibility:
    | "unknown"
    | "conceptual"
    | "plausible"
    | "prototype-tested";
};
```

Do not over-engineer this schema in the first implementation.

It exists to establish the architectural direction.

---

# 10. Recommended Technical Direction

Initial web stack:

```text
Vite
React
TypeScript

Three.js
React Three Fiber
@react-three/drei

Zustand
```

Use the smallest number of dependencies necessary.

Do not introduce a backend until the application actually needs one.

The early application can store concept definitions locally.

---

# 11. Why React Three Fiber

The project is not primarily a Blender viewer.

The final application needs:

- realtime time animation,
- parameter-based geometry,
- user interaction,
- color changes,
- component visibility changes,
- camera controls,
- custom concept logic,
- and potentially runtime export.

Therefore the watch experience should primarily be controlled by application code.

Blender-generated models can be imported where appropriate, but app behavior must remain programmable.

---

# 12. Role of Blender

Blender should be introduced after the first functional prototype.

Blender is useful for:

- detailed case modeling,
- straps,
- crowns,
- decorative elements,
- high-quality materials,
- complex meshes,
- product rendering,
- concept visualization.

Blender should not become a mandatory dependency for every watch concept.

Some experimental watches may be easier to generate procedurally in Three.js.

A hybrid approach is preferred.

```text
Procedural geometry
+
Imported Blender assets
+
Runtime Three.js animation
```

---

# 13. Blender MCP

Blender MCP may later be integrated into the AI workflow.

Potential workflow:

```text
AI Agent
   ↓
Concept description
   ↓
Blender MCP
   ↓
Create / modify 3D geometry
   ↓
Export GLB
   ↓
Import into web application
```

However:

**Do not begin the project with Blender MCP.**

The first milestone must validate the product idea using code-generated 3D geometry.

MCP automation is a later productivity layer.

---

# 14. Higgsfield and Generative Media

Generative media tools may eventually be used for:

- promotional videos,
- concept trailers,
- cinematic watch presentations,
- gallery thumbnails,
- social media content,
- exhibition-style visual storytelling.

They are not part of the core engineering path.

Do not introduce them into the initial application architecture.

---

# 15. Development Phases

## Phase 0 — Repository Bootstrap

Goal:

Create a clean project foundation.

Tasks:

- Create Git repository.
- Initialize Vite + React + TypeScript.
- Add README.
- Add this document.
- Configure basic linting / formatting.
- Create initial folder structure.
- Create the first commit.

Suggested commit:

```text
chore: bootstrap orbital watch lab
```

---

## Phase 1 — 2D Logic Prototype

Before 3D, validate time-display mathematics.

Implement the Orbital Hands concept using SVG or Canvas.

Required:

- realtime clock,
- manual time input,
- hour orbit,
- minute orbit,
- second orbit,
- configurable radii.

Goal:

Prove that the display logic is correct.

---

## Phase 2 — First 3D Watch

Rebuild the same concept using React Three Fiber.

Minimum objects:

- case,
- crystal,
- dial,
- twelve markers,
- hour orbital indicator,
- minute orbital indicator,
- second orbital indicator.

Required interactions:

- orbit camera,
- zoom,
- real-time mode,
- manual time mode.

This is the first true project milestone.

---

## Phase 3 — Viewer Architecture

Extract reusable systems.

Potential modules:

```text
WatchScene
WatchCamera
WatchLighting
WatchControls

TimeController
MaterialController
CustomizationPanel
ConceptRegistry
```

Goal:

New watch concepts should not require rebuilding the entire app.

---

## Phase 4 — Gallery

Add the exhibition experience.

Features:

- watch catalog,
- thumbnails,
- concept metadata,
- category filters,
- watch selection,
- viewer navigation.

At least three distinct concepts should exist before spending significant time polishing the gallery.

---

## Phase 5 — Customization

Add concept-specific customization.

Start with:

- case color,
- dial color,
- indicator color,
- metal roughness,
- strap color.

Avoid creating a universal customization system too early.

---

## Phase 6 — Export

Implement export of the current visual model.

First target:

```text
GLB
```

Requirements:

- export visible configuration,
- preserve current materials where possible,
- exclude editor UI,
- clearly label the output as a visual model.

---

## Phase 7 — AI-assisted Concept Pipeline

Develop an internal workflow for producing new concepts.

Potential process:

```text
idea
↓
concept document
↓
design review
↓
quick implementation
↓
visual review
↓
iteration
↓
gallery entry
```

AI agents may generate ideas, but no concept should enter the permanent gallery without review.

---

## Phase 8 — Blender / Advanced Assets

Introduce Blender-generated assets when procedural geometry becomes limiting.

Potential use cases:

- complex bezels,
- crowns,
- straps,
- skeletonized structures,
- engraved cases,
- decorative movements.

---

# 16. Suggested Repository Structure

Initial direction:

```text
orbital-watch-lab/
│
├─ README.md
├─ PROJECT_VISION.md
├─ AGENTS.md
│
├─ docs/
│   ├─ concepts/
│   │   └─ orbital-hands.md
│   │
│   ├─ decisions/
│   ├─ research/
│   └─ roadmap.md
│
├─ public/
│   ├─ models/
│   ├─ textures/
│   └─ thumbnails/
│
├─ src/
│   ├─ app/
│   ├─ components/
│   ├─ features/
│   │   ├─ gallery/
│   │   ├─ viewer/
│   │   ├─ customization/
│   │   └─ export/
│   │
│   ├─ watches/
│   │   └─ orbital-hands/
│   │
│   ├─ three/
│   │   ├─ camera/
│   │   ├─ lighting/
│   │   ├─ materials/
│   │   └─ utils/
│   │
│   ├─ stores/
│   ├─ types/
│   └─ utils/
│
├─ blender/
├─ assets-source/
└─ experiments/
```

This structure is directional, not sacred.

Refactor it when real requirements become clear.

---

# 17. Watch Concept Folder Pattern

Each watch should eventually be reasonably self-contained.

Example:

```text
src/watches/orbital-hands/
│
├─ OrbitalHandsWatch.tsx
├─ config.ts
├─ metadata.ts
├─ geometry.ts
├─ animation.ts
└─ components/
```

Later this may evolve into a plugin-like architecture.

Do not build a complex plugin system before at least three watches exist.

---

# 18. MVP Definition

The MVP is complete when all of the following work:

## Gallery

- At least three experimental watches can be selected.

## Viewer

- Each watch appears in a realtime 3D viewer.
- Camera rotation works.
- Zoom works.

## Time

- At least one watch displays real time.
- Manual time can be selected.

## Customization

- At least three visual properties can be changed.

Example:

```text
case color
dial color
indicator color
```

## Architecture

- Adding another watch does not require rewriting the entire viewer.

The MVP does **not** require:

- backend,
- user accounts,
- cloud storage,
- Blender MCP,
- Higgsfield,
- CAD,
- manufacturing support,
- advanced physics,
- perfect photorealism.

---

# 19. First Three Suggested Watches

## Watch 001 — Orbital Hands

The original concept.

- Inner numerals.
- Outer orbiting hour/minute/second indicators.
- All indicators point inward.

---

## Watch 002 — Rotating Numeral Ring

The indicator stays visually simple while the numerals themselves rotate.

Potential interpretation:

- hour ring rotates,
- minute reference stays fixed,
- secondary ring represents minutes.

The exact reading system should be explored rather than predetermined.

---

## Watch 003 — Eclipse Watch

Time is represented by overlapping rotating discs.

The intersections reveal:

- hour,
- minute,
- or changing apertures.

The purpose is to explore time as changing negative space rather than traditional hands.

These are starting prompts, not mandatory final designs.

AI agents are encouraged to propose stronger alternatives.

---

# 20. AI Agent Working Rules

This repository is expected to be developed heavily with AI agents.

Agents must not treat every request as an isolated coding task.

Before implementing:

1. Read `PROJECT_VISION.md`.
2. Read relevant concept documents.
3. Inspect the existing architecture.
4. Check recent Git history.
5. Understand the current roadmap.

Then:

1. Select the next bounded task.
2. Implement it.
3. Run tests / build.
4. Review the result.
5. Remove unnecessary complexity.
6. Update documentation if behavior changed.
7. Commit the work.
8. Continue to the next planned task when appropriate.

---

# 21. AI Design Rules

AI-generated ideas are welcome.

However, agents should avoid merely reproducing famous watch designs.

When generating a watch concept, ask:

- Can the time-display principle be meaningfully different?
- Is the motion visually interesting?
- Can a viewer understand how the watch works?
- Is there a reason this concept belongs in this exhibition?
- Does the concept look different from the existing catalog?

Novelty does not require absolute historical uniqueness.

The goal is creative exploration, not claiming patents or asserting that no similar mechanism has ever existed.

Any future claim of historical originality must be separately researched.

---

# 22. Development Rules

Prefer:

- small components,
- explicit types,
- clear naming,
- reusable math utilities,
- concept-specific logic isolated from generic viewer code,
- deterministic animation where possible.

Avoid:

- giant components,
- duplicated watch logic,
- global state for everything,
- premature backend creation,
- premature design-system complexity,
- premature ECS architecture,
- premature plugin frameworks.

Optimize only after measuring.

---

# 23. Rendering Philosophy

The application should eventually feel premium, but visual polish comes in stages.

Priority order:

```text
1. Concept correctness
2. Interaction
3. Readability
4. Architecture
5. Materials
6. Lighting
7. Animation polish
8. Photorealism
```

Do not block product progress on perfect shaders.

---

# 24. Git Strategy

Use Git from the first minute of the project.

Recommended branches:

```text
main
feature/*
fix/*
experiment/*
```

For a solo AI-assisted project, a simple trunk-based workflow is also acceptable.

Prefer small commits with clear intent.

Examples:

```text
chore: bootstrap project
feat: add orbital hand time math
feat: render first three dimensional dial
feat: add manual time controller
feat: add watch concept registry
feat: add case color customization
refactor: isolate viewer camera controls
docs: document orbital hands concept
```

Do not commit generated build output unless required.

Large Blender source files should be handled carefully.

If the repository begins accumulating large binary assets, evaluate Git LFS.

---

# 25. Initial Git Bootstrap Instructions

Agent:

Create the repository using a suitable working directory.

Suggested repository name:

```text
orbital-watch-lab
```

Initialize the application:

```bash
npm create vite@latest orbital-watch-lab -- --template react-ts
cd orbital-watch-lab
npm install
git init
```

Then:

1. Create `PROJECT_VISION.md`.
2. Place this document inside it.
3. Create a concise `README.md`.
4. Create `docs/concepts/orbital-hands.md`.
5. Create the initial project structure.
6. Verify the application runs.
7. Verify production build succeeds.
8. Commit.

Initial commit:

```bash
git add .
git commit -m "chore: bootstrap orbital watch lab"
```

If GitHub CLI is configured and authentication is available, create the remote repository and push `main`.

Do not fail the project bootstrap solely because a GitHub remote cannot be created.

Local Git history comes first.

---

# 26. First Implementation Task

After repository bootstrap, do **not** immediately build the final 3D museum.

Start with the Orbital Hands logic.

Implement a dedicated prototype route or development page.

Requirements:

```text
12 fixed hour markers

hour orbital indicator
minute orbital indicator
second orbital indicator

real-time mode
manual mode

time-speed control
```

Expose parameters for:

```text
numeral radius
hour orbit radius
minute orbit radius
second orbit radius
indicator length
indicator width
```

Use this prototype to determine whether the idea is readable and visually compelling.

Only after this logic works should the concept move into the 3D viewer.

---

# 27. Long-Term Possibilities

This project may eventually expand into:

## Virtual Exhibition

A spatial gallery where watches are displayed like museum pieces.

## Community Concepts

Users submit ideas that are interpreted as watch concepts.

## AI Watch Designer

An AI agent proposes:

- visual concept,
- time-reading method,
- materials,
- motion,
- concept story.

## Procedural Watch Generation

Selected parameters produce families of related designs.

## Concept Evolution

Users fork an existing watch and create variations.

## Export

Save customized models.

## Physical Prototype Track

Separate selected concepts into an engineering repository for:

- CAD,
- tolerances,
- motors,
- gears,
- bearings,
- microcontrollers,
- 3D printing,
- CNC.

The web exhibition should remain independent from this engineering track.

---

# 28. Success Criteria

The project succeeds if someone opens the app and repeatedly thinks:

> "I have never seen a watch display time like this before."

The app should encourage curiosity.

The best concepts should make the viewer want to:

- rotate the model,
- understand the mechanism,
- change its appearance,
- watch time move,
- and imagine the object existing in the real world.

---

# 29. Project Identity

This project should not be optimized around copying existing luxury watches.

Its identity is:

```text
experimental
mechanical
playful
beautiful
interactive
speculative
```

The watch is the medium.

The real subject is:

> **inventing new ways to visualize time.**

---

# 30. Instruction to the First Agent

You are responsible for starting this project.

Do not attempt to implement the entire long-term vision in one pass.

Begin with a maintainable repository and a small working prototype.

Your order of execution is:

```text
1. Bootstrap repository
2. Preserve this project vision
3. Implement orbital time-display mathematics
4. Build a simple visual prototype
5. Review readability
6. Add first 3D implementation
7. Refactor reusable viewer systems
8. Add additional concepts
9. Build the gallery around proven concepts
10. Continue iteratively
```

At every stage:

```text
inspect
plan
implement
test
review
document
commit
repeat
```

Do not stop merely because one feature was completed.

Continue progressing through the documented roadmap while maintaining code quality and periodically reviewing prior work.

The final goal is not a single watch.

The final goal is a growing **3D laboratory of imagined watches**.
