# Rules for Claude in this repository

## Stay strictly in scope
- Change ONLY the files and code needed for the task that was asked. Nothing else.
- Do NOT refactor, rename, reformat, restyle, or "clean up" code that the task does not require.
- Do NOT change layout, styling, colours, spacing, or text in parts of the UI the task did not mention.
- Do NOT delete, move, or rewrite existing features, components, API routes, or Prisma schema fields unless explicitly asked.
- Do NOT upgrade, add, or remove npm dependencies unless explicitly asked.
- Do NOT touch `.env*`, `prisma/` migrations, `package-lock.json`, or config files (`next.config.js`, `tailwind.config.js`, `tsconfig.json`, `postcss.config.js`) unless the task requires it.

## When something else looks wrong
- If you notice a bug or improvement outside the task, MENTION it in your reply — do not fix it.
- If the task seems to require changing shared code (used by other pages/components), explain the impact and ask first.

## Before committing
- Review `git diff` and revert any change that is not directly part of the task.
- In your final reply, list every file you changed and why.
