# src/business module doc

## File Structure

- `api.ts`: api clientsm, covers path prefix, base url, authorization, error handling and more
- business module by domain

## Pattern

Each business module has one or more classes that combines data model and behaviours together, they are named `BusinessClass`.

A BusinessClass uses static properties to stores api client instances.
A BusinessClass extend `Z.class` to declare data model.

Example:

```ts
import { z } from "zod";
import { Z } from "zod-class";
import { CoreApiClient } from "./api"; 

class User extends Z.class({
    id: z.uuid(),
    nickname: z.string(),
    createdAt: z.date()
}) {

    static coreApi = CoreApiClient({
        pathPrefix: "/users",
        defaultSchema: User
    });

    static async getById(id: string): Promise<User> {
        return User.coreApi.get({
            path: `/${id}`
        }).then(({data}) => data.parsed);
    }

    public async save(): void {
        return User.coreApi.patch({body: this});
    }

}
```

## Best Practice

- Add `type <ModelName>Ref` to store primary key type of the model

### Naming

- Name Zod Schema to reuse as `<Something>Z`
- Name Vue component prop field type value in `<Something>Prop`
