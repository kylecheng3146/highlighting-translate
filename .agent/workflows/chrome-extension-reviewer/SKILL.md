---
name: chrome-extension-reviewer
description: Comprehensive code review and auto-fixer for Chrome Extensions (Manifest V3). Analyzes code for best practices, security, and performance. functionality. Use when asked to review, audit, or fix extension code.
---

# Chrome Extension Reviewer

This skill guides the agent through a systematic code review and remediation process for Chrome Extensions, focusing on Manifest V3 compliance, security, and best practices.

## Process Overview

1.  **Analysis**: Audit the codebase against the [Review Checklist](references/review_checklist.md).
2.  **Remediation**: Automatically fix identified issues where safe.
3.  **Reporting**: Generate a comprehensive report of findings and actions.

## 1. Analysis Phase

Step-by-step audit of the extension architecture:

1.  **Manifest Audit (`manifest.json`)**:
    - Verify `manifest_version` is 3.
    - Check for unnecessary `permissions` and `host_permissions`.
    - Validate `web_accessible_resources`.
    - Ensure CSP allows only local resources (no remote script injection).

2.  **Service Worker Audit (`background.js`)**:
    - Check for persistent listeners (good) vs persistent state variables (bad - SWs are ephemeral).
    - Ensure `chrome.storage` is used for state persistence.
    - Verify `chrome.runtime.onInstalled` is used for initialization.

3.  **Content & Popup Script Audit**:
    - Check for direct DOM manipulation best practices.
    - Verify message passing (`chrome.runtime.sendMessage`) includes error handling (`if (chrome.runtime.lastError) ...`).
    - Ensure no use of `eval` or `innerHTML` (unless sanitized).

## 2. Remediation Phase

For every issue found in the Analysis Phase:

- **Auto-fix**: If the fix is clear and safe (e.g., updating manifest syntax, wrapping generic event listeners, adding error checks), apply it directly using `replace_file_content`.
- **Flag**: If the fix requires architectural changes or user input, document it as a "Manual Action Required".

## 3. Reporting Phase

Create a report artifact using the structure in [Report Template](assets/report_template.md).

- **File Path**: `<appDataDir>/brain/<conversation-id>/code_review_report.md`
- Include a summary of all executed fixes.
- List any logic improvements made.
- Highlight any manual steps the user needs to take.

## Usage Tips

- **Be Proactive**: Don't just list errors; fix them.
- **Context Matters**: If the extension uses a framework (React/Vue/Tailwind), respect the build process constraints (e.g., no external CDNs in MV3).
