# Execution Plan

## Completed

1. [complete] Pin the released Web Runtime/API tarball and frozen lock integrity.
2. [complete] Make the Twitter Web target relocatable (`./` base), ES2022, and compatible with
   the actual shared core version; record target publish metadata.
3. [complete] Generate and verify database/runtime contracts from the immutable Core image using
   the official SSH provider and Supabase CLI.
4. [complete] Add a Registry adapter with namespaced exact installations, platform matching,
   digest artifact URL construction, immutable manifest recovery, binding-last enable,
   cleanup-before-delete disable, guarded uninstall, and current-peer-only startup.
5. [complete] Migrate the extension UI to namespace/name/exact-version and explicit peer
   authority. The browser only controls its current Web peer locally or the configured Core peer
   remotely.
6. [complete] Add focused regression coverage for Registry outage, missing/unknown target,
   MF failure atomicity, cleanup failure, uninstall guard, management-peer null-self, third-peer
   rejection, MF force registration, and 204 Core responses.

## Remaining Acceptance Work

1. [complete] Provision the browser client's Registry origin and management Core UUID without
   changing its identity or embedding either value in static artifacts.
2. [Core and PostgREST production paths proven] Core namespaced lifecycle APIs and browser reads
   of the new installation/binding tables are authorized in production. Complete the browser-local
   binding write/delete proof after the native fetch receiver correction is delivered.
3. [target admitted; Pages release-intent correction delivered] The exact-main Web target is
   public and immutable. Strict publication is behind explicit `target-publish.json` release
   intent, so unrelated Host revisions deploy the checked Pages artifact without attempting to
   overwrite the target. Deliver the browser fetch correction, then rerun the full digest-artifact
   enable/cold-start/disable/uninstall proof.
4. [pending migration decision] Decide whether/how legacy `extensions` records migrate to
   Registry installations; do not reinterpret its enabled UUID array.
5. [complete] Run the full `pnpm check` after concurrent target/CD work settles.
