# Widget Prototype

The widget is served by the backend:

```text
GET /widget.js
```

Demo page:

```text
GET /widget-demo
```

## Embed Code

For local testing:

```html
<div id="telegram-site-widget"></div>
<script
  src="http://localhost:3000/widget.js"
  data-api-base-url="http://localhost:3000"
  data-site="default"
  data-limit="5"
></script>
```

For an ngrok live test:

```html
<div id="telegram-site-widget"></div>
<script
  src="https://<ngrok-host>/widget.js"
  data-api-base-url="https://<ngrok-host>"
  data-site="default"
  data-limit="5"
></script>
```

## Current Limits

- One default post source.
- No theme settings yet.
- No polling/auto-refresh yet.

## Next Step

The widget uses the `sites` model and site-scoped API endpoints:

```text
GET /api/sites/default/posts
```

Change `data-site` when multiple sites exist.
