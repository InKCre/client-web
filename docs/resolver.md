# Resolver Notes

The durable client-web resolver architecture is owned by
[Client-Web Info-Base Architecture](info-base/ARCHITECTURE.md#resolver-system)。

Resolvers are exact, versioned interpreters of hydrated block content and direct relations；they
are not merely display components。Unknown resolver、unsupported capability、supported-null and
authored-empty are distinct outcomes。New code uses `refresh` and `materializeMissing` with the
stable semantics recorded by that architecture document。
