# `src/business` coding guideline

## File Structure

- `api.ts`: api clients, covers path prefix, base url, authorization, error handling and more
- `base.ts`: utility functions for business module
- `obsrv.ts`: observability business
- `info-base/`
  - `block.ts`
  - `relation.ts`
  - `source.ts`
- `extension.ts`

## Pattern

Each business module has one or more classes that combine data model and behaviors together, we call it BusinessClass.

A BusinessClass extends `Z.class` to declare the data model using Zod schemas.

BusinessClasses use static properties to store API client instances:

- `dbApi`: `DBAPIClient` for database operations (CRUD via PostgREST).
- `coreApi`: `CoreAPIClient` for core API requests (optional, for non-database operations).

Common static methods include:

- `get(id)`: Fetch a single instance by ID.
- `getAll()` or `list()`: Fetch all instances.
- Additional query methods (e.g., `getRecent()`, `getBySource()`).

Instance methods include:

- `save()` or `update()`: Upsert the instance.
- `delete()`: Remove the instance.
- Domain-specific methods (e.g., `enable()`, `collect()`, `stop()`).

For creating new instances, companion `Form` classes extend `Z.class` with `id: z.undefined()`, and include a `create()` method.

### Scaffold

```ts
import { z } from "zod";
import { Z } from "zod-class";
import { DBAPIClient, CoreAPIClient } from "./api";

export type UserRef = string;
export const UserRefZ = z.string();
export const makeUserProp = (v?: any) => makeObjectProp<User>(v);

class User extends Z.class({
  id: UserRefZ,
  nickname: z.string(),
  createdAt: z.coerce.date().default(() => new Date()),
}) {
  static dbApi: DBAPIClient = new DBAPIClient("users", User);
  static coreApi: CoreAPIClient<User> = new CoreAPIClient("/users", User);

  static async get(id: UserRef): Promise<User> {
    return new User((await this.dbApi.from().select().eq("id", id).single()).data!);
  }

  static async getAll(): Promise<User[]> {
    return (await this.dbApi.from().select()).data!.map((d) => new User(d));
  }

  public async save(): Promise<User> {
    return User.dbApi.first(await User.dbApi.from().upsert(this).select());
  }

  public async delete(): Promise<void> {
    await User.dbApi.from().delete().eq("id", this.id);
  }
}

class UserForm extends Z.class({
  ...User.shape,
  id: z.undefined(),
}) {
  public async create(): Promise<User> {
    return new User((await User.dbApi.from().insert(this).select().single()).data!);
  }
}
```

### Reuse BusinessClass

```ts
import { zinstance } from "@/business/base";

class Post extends Z.class({
    createdBy: zinstance<User>(User),
    ...
}) {
    ...
}
```

## Best Practice

- Add `type <ModelName>Ref` to store primary key type of the model.
- Use object for enum fields.

  ```ts
  const AnEnum = {
    MEMBER_A: "member_a",
    MEMBER_B: "member_b"
  }
  ```

- Include static properties for UI helpers (e.g., `DayOfWeekOptions`, `format()` methods).
- Ensure schemas use appropriate defaults and constraints (e.g., `.default(() => new Date())` for date).
- Use `z.coerce.date()` for date type field so that Zpd can automatically converts strings to Date objects.

### Naming

- Name Zod schemas for reuse as `<Something>Z` (e.g., `UserRefZ`).
- Name Vue component prop helpers as `make<Something>Prop` (e.g., `makeUserProp`).

## References

- <https://github.com/sam-goodwin/zod-class>
- <https://zod.dev/api>
