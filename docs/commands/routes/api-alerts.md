---
title: api alerts
description: Generated alerts API operations
---

# api alerts

Generated from AskNews API 0.31.1.

## Operations

### `asknews api alerts create-alert`

Create an alert.

- Request: `POST /v1/chat/alerts`
- Operation ID: `create_alert`
- Safety: `mutating`

**Request body fields:**

| Option | Type | Required | Description |
| --- | --- | --- | --- |
| `--query` | string or null | no | The query to run for retrieving information from sources, and for checking the alert. If you have defined one or more reports, specify each report's individual query in the report prompt. |
| `--sources` | array or null | no | The sources to use for retrieving information related to the alert query. Available sources are: AskNewsSource, TelegramSource, BlueskySource, WebSource, DeepNewsSource |
| `--alert-type` | string or null | no | The type of alert. If specified, overrides `repeat` and `always_trigger`. 'AlwaysAlertWhen': trigger alert actions any time the alert query is satisfied (`repeat=True`, `always_trigger=False`). Add Report model if you want a report when this is triggered. 'AlertOnceIf': trigger alert actions when the alert query is satisfied and then disable the alert (`repeat=False`, `always_trigger=False`). Add Report model if you want a report when this is triggered. 'ReportAbout': always trigger alert actions according to cron schedule and write a report (`repeat=True`, `always_trigger=True`). Defaults to using DeepNews for the report unless specified. |
| `--model` | string | no | The model that is used to check if the alert conditions are satisfied by sources (this is not the same as the model used to write the report.)Defaults to gpt-4o. Choices: meta-llama/Meta-Llama-3.1-8B-Instruct, gpt-4o-mini, gpt-5-mini, gpt-5-nano, gpt-4o, o3-mini, meta-llama/Meta-Llama-3.3-70B-Instruct, gpt-4.1-2025-04-14, gpt-4.1-nano-2025-04-14, gpt-4.1-mini-2025-04-14, claude-sonnet-5. Default: `"gpt-4o"`. |
| `--cron` | string | yes | How often or when to check sources for this alert, specified as a cron expression. Examples: '0 * * * *' (hourly), '0 9 * * *' (daily at 9am), '0 9 * * 1' (Mondays at 9am). See https://crontab.run/ for more examples. |
| `--triggers` | array<object> | yes |  |
| `--always-trigger` | boolean | no | Whether to always trigger the actions when sources are scanned. This skips the check for if the alert conditions are satisfied and run triggers immediately. Defaults to False. Default: `false`. |
| `--repeat` | boolean | no | Whether to repeat the alert. Default is True. If False, the alert will be disabled after it triggers once. Default: `true`. |
| `--active` | boolean | no | Whether the alert is active or not. Default is True. Default: `true`. |
| `--expires-at` | string or null | no | The expiration date for the alert. Default is None. If set, the alert will be disabled after this date. |
| `--report` | array or null | no | Configuration for generating a written report when the alert triggers. If report is a list, the individual reports will be concatenated into one report in the order they are defined. If not specified, no report is generated. Use ReportRequest(identifier='deepnews', ...) for DeepNews reports.Use ReportRequest(...) or ReportRequest(identifier='legacy', ...) for legacy reports (DEPRECATED). Requests without identifier default to 'deepnews'. Only DeepNews reports can be used in list. |
| `--title` | string or null | no | The title of the alert. If not provided, no title will be used. |
| `--share-link` | string or null | no | The newsplunker share link to update when the alert triggers. |

Use direct kebab-case body options, `--body '{...}'`, or `--body @request.json`.
Direct body options override values supplied through `--body`.

This operation requires confirmation and `--yes` in non-interactive use.

### `asknews api alerts delete-alert`

Delete an alert.

- Request: `DELETE /v1/chat/alerts/{alert_id}`
- Operation ID: `delete_alert`
- Safety: `mutating`

**Options:**

| Option | Description |
| --- | --- |
| `--alert-id` | The alert ID Location: path. Type: string. Required. Format: uuid. |

This operation requires confirmation and `--yes` in non-interactive use.

### `asknews api alerts get-alert`

Get an alert.

- Request: `GET /v1/chat/alerts/{alert_id}`
- Operation ID: `get_alert`
- Safety: `read-only`

**Options:**

| Option | Description |
| --- | --- |
| `--alert-id` | The alert ID Location: path. Type: string. Required. Format: uuid. |
| `--user-id` | The ID of the user to get logs for Location: query. Type: string. Optional. |

### `asknews api alerts get-alert-logs`

Get alert logs.

- Request: `GET /v1/chat/alerts/{alert_id}/logs`
- Operation ID: `get_alert_logs`
- Safety: `read-only`

**Options:**

| Option | Description |
| --- | --- |
| `--alert-id` | The alert ID Location: path. Type: string. Required. Format: uuid. |
| `--user-id` | The ID of the user to get logs for Location: query. Type: string. Optional. |
| `--page` | The page number to get Location: query. Type: integer. Optional. Default: `1`. |
| `--per-page` | The number of items per page Location: query. Type: integer. Optional. Default: `10`. |
| `--all` | Whether to get all the alert logs Location: query. Type: boolean. Optional. Default: `false`. |
| `--start-timestamp` | Timestamp to start search from Location: query. Type: string. Optional. |
| `--end-timestamp` | Timestamp to end search at Location: query. Type: string. Optional. |

### `asknews api alerts get-alerts`

Get all created alerts.

- Request: `GET /v1/chat/alerts`
- Operation ID: `get_alerts`
- Safety: `read-only`

**Options:**

| Option | Description |
| --- | --- |
| `--user-id` | The ID of the user to get alerts for Location: query. Type: string. Optional. |
| `--page` | The page number to get Location: query. Type: integer. Optional. Default: `1`. |
| `--per-page` | The number of items per page Location: query. Type: integer. Optional. Default: `10`. |
| `--all` | Whether to get all the alerts Location: query. Type: boolean. Optional. Default: `false`. |
| `--include-deleted` | Whether to include soft-deleted alerts Location: query. Type: boolean. Optional. Default: `false`. |

### `asknews api alerts get-all-alert-logs`

Get all alert logs.

- Request: `GET /v1/chat/alerts/logs`
- Operation ID: `get_all_alert_logs`
- Safety: `read-only`

**Options:**

| Option | Description |
| --- | --- |
| `--alert-id` | The alert ID Location: query. Type: string. Optional. |
| `--user-id` | The ID of the user to get logs for Location: query. Type: string. Optional. |
| `--page` | The page number to get Location: query. Type: integer. Optional. Default: `1`. |
| `--per-page` | The number of items per page Location: query. Type: integer. Optional. Default: `10`. |
| `--all` | Whether to get all the alert logs Location: query. Type: boolean. Optional. Default: `false`. |
| `--start-timestamp` | Timestamp to start search from Location: query. Type: string. Optional. |
| `--end-timestamp` | Timestamp to end search at Location: query. Type: string. Optional. |

### `asknews api alerts put-alert`

Update an alert.

- Request: `PUT /v1/chat/alerts/{alert_id}`
- Operation ID: `put_alert`
- Safety: `mutating`

**Options:**

| Option | Description |
| --- | --- |
| `--alert-id` | The alert ID Location: path. Type: string. Required. Format: uuid. |

**Request body fields:**

| Option | Type | Required | Description |
| --- | --- | --- | --- |
| `--query` | string or null | no | The query to run for retrieving information from sources, and for checking the alert. If you have defined one or more reports, specify each report's individual query in the report prompt. |
| `--sources` | array or null | no | The sources to use for retrieving information related to the alert query. Available sources are: AskNewsSource, TelegramSource, BlueskySource, WebSource, DeepNewsSource |
| `--alert-type` | string or null | no | The type of alert. If specified, overrides `repeat` and `always_trigger`. 'AlwaysAlertWhen': trigger alert actions any time the alert query is satisfied (`repeat=True`, `always_trigger=False`). Add Report model if you want a report when this is triggered. 'AlertOnceIf': trigger alert actions when the alert query is satisfied and then disable the alert (`repeat=False`, `always_trigger=False`). Add Report model if you want a report when this is triggered. 'ReportAbout': always trigger alert actions according to cron schedule and write a report (`repeat=True`, `always_trigger=True`). Defaults to using DeepNews for the report unless specified. |
| `--model` | string or null | no | The model that is used to check if the alert conditions are satisfied by sources (this is not the same as the model used to write the report.) |
| `--cron` | string or null | no | How often or when to check sources for this alert, specified as a cron expression. Examples: '0 * * * *' (hourly), '0 9 * * *' (daily at 9am), '0 9 * * 1' (Mondays at 9am). See https://crontab.run/ for more examples. |
| `--triggers` | array or null | no | Configuration for actions to trigger for the alert. Available actions are: WebhookAction, EmailAction, ResendBroadcastAction, GoogleDocsAction |
| `--always-trigger` | boolean or null | no | Whether to always trigger the actions when sources are scanned. This skips the check for if the alert conditions are satisfied and run triggers immediately. Defaults to False. |
| `--repeat` | boolean or null | no | Whether to repeat the alert. Default is True. If False, the alert will be disabled after it triggers once. |
| `--active` | boolean or null | no | Whether the alert is active or not. Default is True. |
| `--expires-at` | string or null | no | The expiration date for the alert. Default is None. If set, the alert will be disabled after this date. |
| `--report` | object or array or null | no | Configuration for generating a written report when the alert triggers. If report is a list, the individual reports will be concatenated into one report in the order they are defined. If not specified, no report is generated. Use ReportRequest(identifier='deepnews', ...) for DeepNews reports.Use ReportRequest(...) or ReportRequest(identifier='legacy', ...) for legacy reports (DEPRECATED). Requests without identifier default to 'deepnews'. Only DeepNews reports can be used in list. |
| `--title` | string or null | no | The title of the alert. If not provided, no title will be used. |
| `--share-link` | string or null | no | The newsplunker share link to update when the alert triggers. |

Use direct kebab-case body options, `--body '{...}'`, or `--body @request.json`.
Direct body options override values supplied through `--body`.

This operation requires confirmation and `--yes` in non-interactive use.

### `asknews api alerts run-alert`

Get an alert.

- Request: `GET /v1/chat/alerts/{alert_id}/run`
- Operation ID: `run_alert`
- Safety: `mutating`

**Options:**

| Option | Description |
| --- | --- |
| `--alert-id` | The alert ID Location: path. Type: string. Required. Format: uuid. |
| `--user-id` | The ID of the user to get logs for Location: query. Type: string. Optional. |
| `--is-test` | Whether this is a test run Location: query. Type: boolean. Optional. Default: `false`. |

This operation requires confirmation and `--yes` in non-interactive use.

## Global options

All commands support `--output human|table|json|jsonl|yaml`, `--json`, API/auth URL
overrides, request timeout, and color control. Result data is written to stdout; diagnostics
are written to stderr.
