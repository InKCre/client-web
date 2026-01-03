# Development Guide of InKCre Web extensions

InKCre Web loads extension through Module Federation, extension is the MF Remote.

InKCre provides a playground for extension, which mocks all points Host (apps, eg. client-web, client-webext) will use of the extension.

For most of case, pass the playground test is enough.
But in some situation, a joint debugging is required. At this point, you can give a list of extension you want to joint debug in `.env`, and host will start the dev servers and use Vite to proxy them. At this mode, you can still add breakpoints in extension's code and so debug it.
