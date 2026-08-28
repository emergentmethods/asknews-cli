# OpenAPI schema refresh

The generated command tree is a customer-facing compatibility contract. Refresh it intentionally:

```bash
ASKNEWS_SCHEMA_URL=https://api.asknews.app/openapi.json pnpm sync:openapi
```

`sync:openapi` downloads the schema, regenerates the manifest and command reference, formats the
owned files, runs type checking and the OpenAPI/help contract tests, and rebuilds the executable.

For CI or a clean release checkout:

```bash
pnpm sync:openapi:check
```

The check variant performs the same synchronization and fails if tracked generated files changed.

Review:

- schema version and operation count;
- added, removed, or renamed operation IDs;
- parameter defaults, enums, formats, and request-body fields;
- internal-scope filtering;
- read-only, high-cost, and mutating safety classifications;
- generated command reference changes;
- curated commands whose operation IDs or request shapes changed.

The OpenAPI contract test must prove that every non-internal operation appears exactly once and that
the default OAuth login scopes cover every customer scope required by the schema. Commit the schema,
manifest, generated command reference, affected tests, and feature-doc update together.
