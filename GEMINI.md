# StoryNest World — Antigravity Workspace Guidelines

## 1. Command Explanations & Transparency
Whenever introducing or executing terminal/CLI commands, flags, or scripts (e.g., `git`, `prisma`, `npx tsc`, `npm`):
- **Provide an overview**: Explain in simple terms what the command accomplishes.
- **Break down flags**: Explain what each parameter/flag does (e.g., `--noEmit`, `--name`, `-b`, `-u`).
- **State why**: Clarify why this command is being used for the current task.

## 2. Database & Data Safety
- **Never delete or reset database tables** unless explicitly requested by the user.
- **Maintain migration history** using Prisma versioned migrations.

## 3. High Code Quality & Aesthetics
- Maintain rich UI aesthetics with smooth animations and curated color palettes.
- Include proper error handling, token validation, and clear database loading states across all views.
