#!/usr/bin/env bash

set -euo pipefail

: "${INKCRE_EXTENSION_REGISTRY_TOKEN:?publisher token is required}"
: "${INKCRE_EXTENSION_REGISTRY_URL:?registry URL is required}"
: "${SOURCE_REPOSITORY:?source repository is required}"
: "${SOURCE_REVISION:?source revision is required}"

workspace=${GITHUB_WORKSPACE:-$PWD}
summary=${GITHUB_STEP_SUMMARY:-/dev/stdout}
build_id="client-web-extension-release-${GITHUB_RUN_ID:-local}"
mkdir -p .extension-delivery

for package_path in extensions/*/package.json; do
  descriptor="$(node --input-type=module --eval '
    import { readFile } from "node:fs/promises"
    import path from "node:path"
    const packagePath = process.argv[1]
    const manifest = JSON.parse(await readFile(packagePath, "utf8"))
    if (!manifest.inkcre?.module_federation) process.exit(0)
    process.stdout.write([path.basename(path.dirname(packagePath)), manifest.inkcre.name, manifest.version].join("\t"))
  ' "$package_path")"
  if [[ -z "$descriptor" ]]; then
    continue
  fi
  IFS=$'\t' read -r extension_directory extension_path release_path <<< "$descriptor"

  delivery_directory=".extension-delivery/$extension_directory"
  artifact_directory="extensions/$extension_directory/dist/client-web"
  mkdir -p "$delivery_directory"
  public_descriptor="$delivery_directory/public-release.json"
  status="$(curl --silent --show-error --output "$public_descriptor" --write-out '%{http_code}' \
    "${INKCRE_EXTENSION_REGISTRY_URL%/}/v1/extensions/${extension_path}/releases/${release_path}")"
  if [[ "$status" == '200' ]]; then
    has_native_association="$(node --input-type=module --eval 'import { readFile } from "node:fs/promises"; const release = JSON.parse(await readFile(process.argv[1], "utf8")); process.stdout.write(String(release.module_federation !== null))' "$public_descriptor")"
  elif [[ "$status" == '404' ]]; then
    has_native_association=false
  else
    echo "Cannot determine $extension_path $release_path Registry state: HTTP $status." >&2
    exit 1
  fi
  if [[ "$has_native_association" == 'true' ]]; then
    echo "$extension_path $release_path is already published." >> "$summary"
    continue
  fi

  node scripts/verify-native-extension-distribution.mjs prepare-body \
    --package "$package_path" \
    --core-package packages/core/package.json \
    --artifact-directory "$artifact_directory" \
    --source-repository "$SOURCE_REPOSITORY" \
    --source-revision "$SOURCE_REVISION" \
    --build-id "$build_id" \
    --output "$delivery_directory/prepare.json"
  (
    cd "$artifact_directory"
    zip -q -r "$workspace/$delivery_directory/snapshot.zip" .
  )

  curl --fail-with-body --silent --show-error \
    --request POST \
    --header "Authorization: Bearer $INKCRE_EXTENSION_REGISTRY_TOKEN" \
    --header 'Content-Type: application/json' \
    --data-binary "@$delivery_directory/prepare.json" \
    "${INKCRE_EXTENSION_REGISTRY_URL%/}/v1/extensions/${extension_path}/releases" \
    > "$delivery_directory/prepared-release.json"
  curl --fail-with-body --silent --show-error \
    --request POST \
    --header "Authorization: Bearer $INKCRE_EXTENSION_REGISTRY_TOKEN" \
    --form "content=@$delivery_directory/snapshot.zip;type=application/zip" \
    "${INKCRE_EXTENSION_REGISTRY_URL%/}/v1/extensions/${extension_path}/releases/${release_path}/module-federation" \
    > "$delivery_directory/uploaded-release.json"
  curl --fail-with-body --silent --show-error \
    --request POST \
    --header "Authorization: Bearer $INKCRE_EXTENSION_REGISTRY_TOKEN" \
    "${INKCRE_EXTENSION_REGISTRY_URL%/}/v1/extensions/${extension_path}/releases/${release_path}/publish" \
    > "$delivery_directory/published-release.json"
  node scripts/verify-native-extension-distribution.mjs verify-public \
    --registry-url "$INKCRE_EXTENSION_REGISTRY_URL" \
    --package "$package_path" \
    --core-package packages/core/package.json \
    --artifact-directory "$artifact_directory" \
    --output "$delivery_directory/verification.json"
  echo "$extension_path $release_path published and verified." >> "$summary"
done
