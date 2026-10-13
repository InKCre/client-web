# Changesets

Application and SDK changes use `pnpm changeset`. The package Version PR consumes these files and
updates their versions and changelogs; it does not publish Extensions. Native producers under
`extensions/` are excluded: their shared Release version comes from core-py. Record native producer
changes in the corresponding core-py Extension release fragment before selecting its Web revision.
