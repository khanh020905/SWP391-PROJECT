# Git Deployment & Submission Rules

This document outlines the specific rules regarding git repositories for this project. The AI Agent **MUST ALWAYS** follow these guidelines when pushing code or deploying.

## 1. Primary Repository (For Teacher Review)
**URL:** `https://github.com/SUMMER2026SE/swp391-rbl-project-team4_swp391.git`
**Remote Name:** Typically `origin`
- **Purpose:** This is the official project repository. All feature branches, bug fixes, and project milestones **MUST** be pushed here so that the teacher can review the commits and evaluate the work.
- **Rule:** By default, whenever you complete a task and commit changes, you **must push** to this repository.

## 2. Vercel Deployment Repository
**URL:** `https://github.com/khanh020905/SWP391-PROJECT.git`
**Remote Name:** Custom (e.g., `khanh` or `vercel`)
- **Purpose:** This repository is used exclusively for triggering Vercel deployments. It is connected to the Vercel project dashboard.
- **Rule:** You should **only** push to this repository when the user explicitly asks you to "trigger Vercel" or "deploy to Vercel". Do not use this as the primary remote for saving the project's code.

## Summary Checklist for AI Agent
- [ ] Did I commit the code?
- [ ] Did I push the code to the `SUMMER2026SE` repository for the teacher?
- [ ] If the user asked for a Vercel deploy, did I *also* push to the `khanh020905` repository?
