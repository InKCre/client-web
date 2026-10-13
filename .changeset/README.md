# Changesets

Each user-visible Extension change carries a small Markdown file that declares the affected
Extension package and SemVer impact. Run `pnpm changeset` to create one. The automated Version PR
consumes these files and updates package versions and changelogs; it does not publish packages.
