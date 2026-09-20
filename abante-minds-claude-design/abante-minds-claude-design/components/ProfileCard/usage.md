The personalized ID-card moment at login/profile — a warm "Hello, [name]" greeting plus a simple chosen-color avatar, not a glossy sticker badge. Built from `surface-200`, `shadow-card`, and the same `skill-*` color set used for topic identity (reused here for the learner's own chosen color, not tied to a skill).

The consumer provides `name`, an optional `school` (school or barangay), an optional `initial` (defaults to the first letter of `name`), and a `colorKey` for the avatar fill — the personalization choice made at signup.

Do:
- Keep this warm and plain: real name, real school/barangay, one chosen color. That's the whole personalization surface for now.
- Use it on the login/profile screen only — it's a greeting, not a repeating nav element.

Don't:
- Don't add glossy gradients, chrome-sticker text effects, or Y2K badge styling — flagged and deliberately left out of this system.
- Don't invent achievement badges or stats on this card yet; nothing in the Oct 10 scope defines them.
