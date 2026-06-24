<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:git-repo-rules -->
# Git Deployment & Submission Rules
- **Teacher Repository:** `https://github.com/SUMMER2026SE/swp391-rbl-project-team4_swp391.git` (`origin`). All work **must** be pushed here for grading.
- **Vercel Repository:** `https://github.com/khanh020905/SWP391-PROJECT.git` (`khanh`). **Only** push to this repo when explicitly asked to trigger Vercel deployment.
<!-- END:git-repo-rules -->

# Formatting Rules for Exam Passages and Sections
For all skills (Reading, Listening, Writing, Speaking):
1. **Filtering & Sorting**: Always filter test questions/passages to only match the target exam prefix (e.g., `bc-passage-` for British Council Test 1) and sort them alphabetically (e.g., `bc-passage-1`, `bc-passage-2`, `bc-passage-3`) to maintain the exact sequence of the PDF.
2. **Matching Placeholders & Instructions**: For matching type questions, dynamically display appropriate placeholder text (e.g., `"— Chọn đoạn văn —"` for paragraph matching, `"— Chọn heading —"` for heading matching, and generic instructions matching the PDF questions).
