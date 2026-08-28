---
title: api newsletters
description: Generated newsletters API operations
---

# api newsletters

Generated from AskNews API 0.31.1.

## Operations

### `asknews api newsletters delete-newsletter`

Delete a newsletter.

- Request: `DELETE /v1/chat/newsletters/{newsletter_id}`
- Operation ID: `delete_newsletter`
- Safety: `mutating`

**Options:**

| Option | Description |
| --- | --- |
| `--newsletter-id` | The newsletter ID Location: path. Type: string. Required. Format: uuid. |

This operation requires confirmation and `--yes` in non-interactive use.

### `asknews api newsletters delete-newsletter-contact`

Delete a newsletter contact.

- Request: `DELETE /v1/chat/newsletters/{newsletter_id}/contacts/{contact_id}`
- Operation ID: `delete_newsletter_contact`
- Safety: `mutating`

**Options:**

| Option | Description |
| --- | --- |
| `--newsletter-id` | The newsletter ID Location: path. Type: string. Required. Format: uuid. |
| `--contact-id` | The contact ID Location: path. Type: string. Required. |

This operation requires confirmation and `--yes` in non-interactive use.

### `asknews api newsletters get-newsletter`

Get a newsletter.

- Request: `GET /v1/chat/newsletters/{newsletter_id}`
- Operation ID: `get_newsletter`
- Safety: `read-only`

**Options:**

| Option | Description |
| --- | --- |
| `--newsletter-id` | The newsletter ID Location: path. Type: string. Required. Format: uuid. |

### `asknews api newsletters get-newsletter-contact`

Get a newsletter contact.

- Request: `GET /v1/chat/newsletters/{newsletter_id}/contacts/{contact_id}`
- Operation ID: `get_newsletter_contact`
- Safety: `read-only`

**Options:**

| Option | Description |
| --- | --- |
| `--newsletter-id` | The newsletter ID Location: path. Type: string. Required. Format: uuid. |
| `--contact-id` | The contact ID Location: path. Type: string. Required. |

### `asknews api newsletters get-newsletter-contacts`

Get newsletter contacts.

- Request: `GET /v1/chat/newsletters/{newsletter_id}/contacts`
- Operation ID: `get_newsletter_contacts`
- Safety: `read-only`

**Options:**

| Option | Description |
| --- | --- |
| `--newsletter-id` | The newsletter ID Location: path. Type: string. Required. Format: uuid. |

### `asknews api newsletters get-newsletters`

Get all created newsletters.

- Request: `GET /v1/chat/newsletters`
- Operation ID: `get_newsletters`
- Safety: `read-only`

### `asknews api newsletters get-public-newsletters`

Get all public newsletters.

- Request: `GET /v1/chat/newsletters/public`
- Operation ID: `get_public_newsletters`
- Safety: `read-only`

**Options:**

| Option | Description |
| --- | --- |
| `--page` | The page number to get Location: query. Type: integer. Optional. Default: `1`. |
| `--per-page` | The number of items per page Location: query. Type: integer. Optional. Default: `10`. |
| `--all` | Whether to get all the public newsletters Location: query. Type: boolean. Optional. Default: `false`. |

### `asknews api newsletters patch-newsletter-contact`

Update a newsletter contact.

- Request: `PATCH /v1/chat/newsletters/{newsletter_id}/contacts/{contact_id}`
- Operation ID: `patch_newsletter_contact`
- Safety: `mutating`

**Options:**

| Option | Description |
| --- | --- |
| `--newsletter-id` | The newsletter ID Location: path. Type: string. Required. Format: uuid. |
| `--contact-id` | The contact ID Location: path. Type: string. Required. |

**Request body fields:**

| Option | Type | Required | Description |
| --- | --- | --- | --- |
| `--email` | string | yes |  |
| `--first-name` | string or null | no |  |
| `--last-name` | string or null | no |  |
| `--unsubscribed` | boolean | no | Default: `false`. |

Use direct kebab-case body options, `--body '{...}'`, or `--body @request.json`.
Direct body options override values supplied through `--body`.

This operation requires confirmation and `--yes` in non-interactive use.

### `asknews api newsletters post-newsletter`

Create a newsletter.

- Request: `POST /v1/chat/newsletters`
- Operation ID: `post_newsletter`
- Safety: `mutating`

**Request body fields:**

| Option | Type | Required | Description |
| --- | --- | --- | --- |
| `--name` | string | yes | The name of the newsletter. |
| `--query` | string | yes | The natural language query to run for the newsletter. |
| `--cron` | string | yes | The cron schedule for the newsletter. For example daily at 00:00 UTC is '0 0 * * *'. See https://crontab.run/ for more examples |
| `--model` | string | yes | The model to use for the newsletter. Choices: gpt-4o, gpt-4o-mini, claude-3-5-sonnet-latest, meta-llama/Meta-Llama-3.1-405B-Instruct, meta-llama/Meta-Llama-3.3-70B-Instruct. |
| `--subject` | string or null | no | The subject of the newsletter. If not provided it will be auto generated. |
| `--sender` | string | yes | The sender of the newsletter. |
| `--logo-url` | string or null | no | The logo URL for the newsletter. |
| `--reply-to` | string or null | no | The reply-to address for the newsletter. If not provided, the sender will be used. |
| `--audience-id` | string or null | no | The audience ID to use for the newsletter. If not provided a new audience will be created. |
| `--resend-api-key` | string or null | no | The resend API key to use for the newsletter. If not provided, the newsletter will not be sent. |
| `--public` | boolean | no | Whether the newsletter is public or not. If not provided, the newsletter will be public. If you make the newsletter public only title and query will be shown. Default: `true`. |
| `--active` | boolean | no | Whether the newsletter is active or not. If not provided, the newsletter will be active. If you make the newsletter inactive, it will not be sent. Default: `true`. |
| `--expires-at` | string or null | no | The expiration date for the alert. Default is None. If set, the alert will be disabled after this date. |

Use direct kebab-case body options, `--body '{...}'`, or `--body @request.json`.
Direct body options override values supplied through `--body`.

This operation requires confirmation and `--yes` in non-interactive use.

### `asknews api newsletters post-newsletter-contacts`

Create a newsletter contact.

- Request: `POST /v1/chat/newsletters/{newsletter_id}/contacts`
- Operation ID: `post_newsletter_contacts`
- Safety: `mutating`

**Options:**

| Option | Description |
| --- | --- |
| `--newsletter-id` | The newsletter ID Location: path. Type: string. Required. Format: uuid. |

**Request body fields:**

| Option | Type | Required | Description |
| --- | --- | --- | --- |
| `--email` | string | yes |  |
| `--first-name` | string or null | no |  |
| `--last-name` | string or null | no |  |
| `--unsubscribed` | boolean | no | Default: `false`. |

Use direct kebab-case body options, `--body '{...}'`, or `--body @request.json`.
Direct body options override values supplied through `--body`.

This operation requires confirmation and `--yes` in non-interactive use.

### `asknews api newsletters put-newsletter`

Update a newsletter.

- Request: `PUT /v1/chat/newsletters/{newsletter_id}`
- Operation ID: `put_newsletter`
- Safety: `mutating`

**Options:**

| Option | Description |
| --- | --- |
| `--newsletter-id` | The newsletter ID Location: path. Type: string. Required. Format: uuid. |

**Request body fields:**

| Option | Type | Required | Description |
| --- | --- | --- | --- |
| `--name` | string or null | no | The name of the newsletter. |
| `--query` | string or null | no | The natural language query to run for the newsletter. |
| `--cron` | string or null | no | The cron schedule for the newsletter. For example daily at 00:00 UTC is '0 0 * * *'. See https://crontab.run/ for more examples |
| `--model` | string or null | no | The model to use for the newsletter. |
| `--subject` | string or null | no | The subject of the newsletter. If not provided it will be auto generated. |
| `--sender` | string or null | no | The sender of the newsletter. |
| `--logo-url` | string or null | no | The logo URL for the newsletter. |
| `--reply-to` | string or null | no | The reply-to address for the newsletter. If not provided, the sender will be used. |
| `--audience-id` | string or null | no | The audience ID to use for the newsletter. If not provided a new audience will be created. |
| `--resend-api-key` | string or null | no | The resend API key to use for the newsletter. If not provided, the newsletter will not be sent. |
| `--public` | boolean or null | no | Whether the newsletter is public or not. If not provided, the newsletter will be public. If you make the newsletter public only title and query will be shown. |
| `--active` | boolean or null | no | Whether the newsletter is active or not. If not provided, the newsletter will be active. If you make the newsletter inactive, it will not be sent. |
| `--expires-at` | string or null | no | The expiration date for the alert. Default is None. If set, the alert will be disabled after this date. |

Use direct kebab-case body options, `--body '{...}'`, or `--body @request.json`.
Direct body options override values supplied through `--body`.

This operation requires confirmation and `--yes` in non-interactive use.

## Global options

All commands support `--output human|table|json|jsonl|yaml`, `--json`, API/auth URL
overrides, request timeout, and color control. Result data is written to stdout; diagnostics
are written to stderr.
