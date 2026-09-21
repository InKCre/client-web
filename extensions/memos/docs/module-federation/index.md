---
description: Use the Memos Web Extension to prepare connection details for a compatible app.
---

# Prepare your client connection

The Memos Web Extension provides a connection-preparation interface. It does not create a Source,
schedule collection, or write a test note. The Core and browser must use matching Distributions of
the same installed Extension Release.

1. In **Extensions**, enable Memos in this browser, then open **Setup**.
2. Choose the online Core providing the service. A single eligible Core is selected automatically.
3. If its address is missing, set the Core's Public HTTP Base URL in **Clients → Config** and
   select **Refresh status**. The address must be reachable from your client device.
4. If you have no saved PAT, select **Generate PAT** or enter one you already prepared, then select
   **Save PAT and enable Memos**. It must have the `memos_pat_` prefix and 32 ASCII letters or digits.
5. If a PAT already exists, the page reuses it. Select **Enable Memos on this Core** if necessary.
6. Copy **Server URL** and **Personal Access Token** into your compatible client's sign-in screen.
   Keep `/memos` in the URL; do not add `/api/v1` or use the PostgREST address.

An already configured connection opens directly on these connection details. Opening or refreshing
the page never generates or rotates a PAT. The result says that the information is ready; verify
the actual sign-in in the external app. The established compatibility baseline is MoeMemos Android
2.0.4, not every Memos version.

Saving and enabling are separate operations. If saving fails, the draft remains available. If
enablement fails after saving, retry with that saved PAT. An uncertain response first requires
reading the actual saved state; do not generate another credential just to retry. If copying is
unavailable, reveal the token and manually select it. Hide it again before sharing a screenshot.

PAT replacement and revocation remain explicit Extension Config operations. Replacing a token
requires updating every app that used the old token. This setup interface never does it silently.
