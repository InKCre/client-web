# Architecture of InKCre Web extensions

- Extension are Module Federation Remote, will be served on `https://{INKCRE_EXT_REGISTRY_URL}/{extension_id}/client-web`.
- Extension needs config (config has to be the same across different implementation, eg in python)
- Extension can and have to access all core API.
