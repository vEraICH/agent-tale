# Tim's Working State

> This file is maintained by Tim at the end of each session.
> It's a snapshot, not a log. Overwrite entirely each session.

## Current focus
VRA-Lab V.3 — personalization in progress, V.1 and V.2 completed.

## Completed this session
- Nav logo moved to left side with solid circle background (theme-aware)
- Light theme nav logo: black circle, white icon via CSS filter
- Hero constellation: static by default, continuous rotation on hover, bounce-back to origin on hover-out (spring physics JS)
- Inner SVG animations (globe-spin, node-pulse) use animation-play-state: paused/running
- Hero grid: pulse on hover (A) + radial cursor reveal (B) via CSS mask + mousemove
- Responsive nav: hamburger menu at 640px breakpoint, morphs to X
- Hamburger is 33px circle twin to nav logo, same styling
- ThemeToggle pulled out of hamburger — always visible
- Mobile: burger swaps to left (thumb reach), logo to right (order CSS)
- Nav links right-aligned on desktop (margin-inline-start: auto)
- Mobile home: constellation hidden, full-width hero text, flat grid, 1-col Working On
- Consistent 60rem max-width across PostLayout, LessonLayout, tags pages
- About page (/about) with VRA Lab intro, Agent-Tale section, author bio
- About link added to desktop nav + mobile hamburger
- Custom favicon: white logo on black circle, used in BaseLayout + both admin pages
- New blog post: "Building a Bounce" — CSS animation techniques with code examples
- Updated welcome.md via admin UI
- TASKS.md: V.1 and V.2 marked completed

## Blockers / open questions
- Favicon SVG transform positioning may need fine-tuning (user said not readable first attempt, switched to high-contrast black/white)
- X handle set to x.com/vEraICH — confirm if correct
- Light theme not tested thoroughly beyond nav logo

## Next session should start with
- V.3 remaining: author bio component on post pages (if wanted), further content personalization
- V.4: First deploy to blog.vra-lab.tech (follow private-docs/deployment/vra-lab-railway.md)
- Post page styling review — code blocks, typography, prose width now at 60rem (may want narrower prose with wider container)

## Important context for next Tim
- Home container: 60rem, site wrapper: 68rem
- All page layouts now 60rem (PostLayout, LessonLayout, tags)
- Hero has inline SVG (not <img>) for CSS animation-play-state to work
- Outer 3D rotation uses JS (requestAnimationFrame) for bounce-back — CSS animation-play-state can't return to origin
- Grid radial reveal: CSS custom properties --grid-x/--grid-y updated via mousemove, drives mask-image
- Nav structure: logo | nav-links | ThemeToggle | burger — on mobile, burger order:-1 (left), logo order:1 (right)
- Mobile menu: .nav-mobile-menu with is-open class toggle via JS
- Favicon: /brand/vra-lab-favicon.svg (black circle, white logo) — admin pages have own <head>, not BaseLayout
- About page: /about — standalone Astro page, not a markdown post
- 5 posts total: welcome.md, threadline.md, the-third-collaborator.md, slow-reading-in-a-fast-model-world.md, building-a-bounce.md
- Vashira Ravipanich (raQuiam) — product/engineering leader in Thailand, GIS Co., cross-domain background (web → mobile → GIS → product)
