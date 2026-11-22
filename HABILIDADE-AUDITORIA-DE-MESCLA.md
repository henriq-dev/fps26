---
name: web-project-merge-audit
description: Compare, consolidate, audit, and package multiple versions or ZIP archives of a web project. Use when a user asks to merge project snapshots, preserve cumulative changes, inspect conflicts or missing dependencies, validate runtime/service-worker behavior, or deliver a final archive.
---

# Web Project Merge and Audit

Use this workflow to consolidate supplied project archives without blindly overwriting newer work.

## 1. Inventory and preserve inputs

1. Identify every archive, extract each to a separate temporary directory, and record its root directory, file list, sizes, and available documentation.
2. Never edit the supplied archives or treat a checkpoint as a release unless the user says so.
3. Run each version's documented tests before merging. Record the exact command and result.
4. Compare file lists and hashes to learn which files changed between versions. Use focused diffs for source, tests, manifests, dependency declarations, and documentation; exclude minified vendor bundles from noisy searches.

## 2. Choose the integration strategy

1. Establish the user's intended target version. When unclear, prefer the newest complete snapshot as the base, not necessarily the highest-numbered filename if it appears incomplete.
2. Classify changes as cumulative, unique, superseded, conflicting, or documentation-only.
3. Keep the later implementation when it already includes a checkpoint's behavior in a more complete form. Do not paste old code over new code merely to preserve history.
4. Merge unique behavior deliberately; resolve conflicts by inspecting call sites, shared state, module load order, and tests.
5. Preserve useful historical guides and checkpoint notes without implying that stale variants are runtime source. Add a merge note describing the chosen base, integrated changes, superseded changes, and unresolved limits.
6. Never change gameplay balance, external services, or user data beyond the requested scope. Local archive inspection and file generation are in scope when requested.

## 3. Audit integration and dependencies

Check all of the following where applicable:

- HTML script/style references and load order; verify referenced local files exist.
- CSS `url(...)`, manifest icons/start URL, and service-worker precache resources.
- `package.json` dependencies versus imports/requires; distinguish dev/test dependencies from browser runtime requirements.
- External URLs/CDNs, dynamic imports, and accidental network dependencies. Prefer documenting them over silently replacing them.
- Duplicate/conflicting global declarations when classic scripts share one page namespace.
- Storage keys, control bindings, changed gameplay paths, and service-worker cache versioning.
- Ensure a changed service worker has a new cache identity when required by that project's update strategy; verify install/activate cleanup and same-origin behavior.

## 4. Validate the final tree

1. Run the merged project's tests and syntax checks from its own root.
2. Compare test coverage to newly merged behavior; passing legacy tests does not prove new interactions work.
3. If a browser is available, serve the project over local HTTP and load it in headless Chromium. Inspect console/runtime errors, network failures, and the core start/menu path; use a representative interaction path if practical.
4. Verify service-worker precache paths and response status. Note that a simulated browser/GPU is not a hardware performance benchmark.
5. Report what was and was not tested; don't claim manual playtesting when only static or automated checks ran.

## 5. Document and package

1. Update the user-visible app/version label, merge report, and service-worker cache label consistently.
2. Include a concise quick-start guide with prerequisites, exact run/test commands, local address, and known limitations.
3. Create the final archive from the verified output directory, not from mixed temporary extraction roots.
4. Run archive integrity validation (`unzip -t` for ZIP), list final size, and deliver one direct clickable link to the artifact.
5. Keep the report concise: summary; source-of-truth choice; changes integrated/superseded; tests and runtime evidence; remaining risks; download link.

## Default report outline

# Consolidated project audit

## Result
[One-paragraph status]

## Merge decisions
[Base version and how each other snapshot was handled]

## Validation
[Commands, tests, local-browser/network checks]

## Remaining risks
[Untested behavior, device-specific concerns, known incompatibilities]

## Deliverable
[Clickable final archive]
