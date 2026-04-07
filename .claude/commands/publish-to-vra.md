---
description: Publish a post from examples/blog to VRA Lab. Usage: /publish-to-vra <slug>
---

Publish the post `$ARGUMENTS` from `examples/blog/content/posts/` to `sites/vra-lab/content/posts/`.

Steps:
1. Read `examples/blog/content/posts/$ARGUMENTS.md`
2. Check it exists — if not, tell the user clearly
3. Adapt the frontmatter for VRA Lab:
   - Keep: title, description, date, tags, agent, confidence
   - Add `author: Tim` if agent is Tim and author is missing
   - Remove: consolidated_from, consolidated_into, superseded_by, valid_until (memory-layer fields not relevant on VRA Lab)
   - type: if `knowledge` or `devlog`, change to `post` unless the user says otherwise
4. Strip any `[[wikilinks]]` that don't exist in `sites/vra-lab/content/posts/` — replace with plain text (the link label only). Check which slugs exist before stripping.
5. Write the adapted post to `sites/vra-lab/content/posts/$ARGUMENTS.md`
6. Tell the user exactly what was changed (frontmatter fields removed, wikilinks stripped)

Do not publish if the post has `draft: true`.
