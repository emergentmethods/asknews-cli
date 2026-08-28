# alerts

Create and manage AskNews alerts

## Commands

### `asknews alerts list`

List alerts

**Options:**

| Option | Description |
| --- | --- |
| `--user-id <value>` | The ID of the user to get alerts for [query, string, optional] |
| `--page <value>` | The page number to get [query, integer, optional, default: 1] |
| `--per-page <value>` | The number of items per page [query, integer, optional, default: 10] |
| `--all [boolean]` | Whether to get all the alerts [query, boolean, optional, default: false] |
| `--include-deleted [boolean]` | Whether to include soft-deleted alerts [query, boolean, optional, default: false] |

**Examples:**

```bash
asknews alerts list --output json
```

### `asknews alerts get <alert-id>`

Get an alert

**Arguments:**

| Argument | Description |
| --- | --- |
| `<alert-id>` | alert UUID |

**Options:**

| Option | Description |
| --- | --- |
| `--user-id <value>` | The ID of the user to get logs for [query, string, optional] |

### `asknews alerts create`

Create an alert

**Options:**

| Option | Description |
| --- | --- |
| `--body <json-or-file>` | complete alert JSON or @file.json |
| `-y, --yes` | confirm alert create |
| `--query <value>` | The query to run for retrieving information from sources, and for checking the alert. If you have defined one or more reports, specify each report's individual query in the report prompt. [body, string\|null, optional] |
| `--sources <value>` | The sources to use for retrieving information related to the alert query. Available sources are: AskNewsSource, TelegramSource, BlueskySource, WebSource, DeepNewsSource [body, array\|null, optional] |
| `--alert-type <value>` | The type of alert. If specified, overrides `repeat` and `always_trigger`. 'AlwaysAlertWhen': trigger alert actions any time the alert query is satisfied (`repeat=True`, `always_trigger=False`). Add Report model if you want a report when this is triggered. 'AlertOnceIf': trigger alert actions when the alert query is satisfied and then disable the alert (`repeat=False`, `always_trigger=False`). Add Report model if you want a report when this is triggered. 'ReportAbout': always trigger alert actions according to cron schedule and write a report (`repeat=True`, `always_trigger=True`). Defaults to using DeepNews for the report unless specified. [body, string\|null, optional] Choices: AlwaysAlertWhen, AlertOnceIf, ReportAbout. |
| `--model <value>` | The model that is used to check if the alert conditions are satisfied by sources (this is not the same as the model used to write the report.)Defaults to gpt-4o. [body, string, optional, default: "gpt-4o"] Choices: meta-llama/Meta-Llama-3.1-8B-Instruct, gpt-4o-mini, gpt-5-mini, gpt-5-nano, gpt-4o, o3-mini, meta-llama/Meta-Llama-3.3-70B-Instruct, gpt-4.1-2025-04-14, gpt-4.1-nano-2025-04-14, gpt-4.1-mini-2025-04-14, claude-sonnet-5. |
| `--cron <value>` | How often or when to check sources for this alert, specified as a cron expression. Examples: '0 * * * *' (hourly), '0 9 * * *' (daily at 9am), '0 9 * * 1' (Mondays at 9am). See https://crontab.run/ for more examples. [body, string, required] |
| `--triggers <value>` | body array<object> value [body, array<object>, required] |
| `--always-trigger [boolean]` | Whether to always trigger the actions when sources are scanned. This skips the check for if the alert conditions are satisfied and run triggers immediately. Defaults to False. [body, boolean, optional, default: false] |
| `--repeat [boolean]` | Whether to repeat the alert. Default is True. If False, the alert will be disabled after it triggers once. [body, boolean, optional, default: true] |
| `--active [boolean]` | Whether the alert is active or not. Default is True. [body, boolean, optional, default: true] |
| `--expires-at <value>` | The expiration date for the alert. Default is None. If set, the alert will be disabled after this date. [body, string\|null, optional] |
| `--report <value>` | Configuration for generating a written report when the alert triggers. If report is a list, the individual reports will be concatenated into one report in the order they are defined. If not specified, no report is generated. Use ReportRequest(identifier='deepnews', ...) for DeepNews reports.Use ReportRequest(...) or ReportRequest(identifier='legacy', ...) for legacy reports (DEPRECATED). Requests without identifier default to 'deepnews'. Only DeepNews reports can be used in list. [body, array\|null, optional] |
| `--title <value>` | The title of the alert. If not provided, no title will be used. [body, string\|null, optional] |
| `--share-link <value>` | The newsplunker share link to update when the alert triggers. [body, string\|null, optional] |

### `asknews alerts update <alert-id>`

Update an alert

**Arguments:**

| Argument | Description |
| --- | --- |
| `<alert-id>` | alert UUID |

**Options:**

| Option | Description |
| --- | --- |
| `--body <json-or-file>` | complete alert JSON or @file.json |
| `-y, --yes` | confirm alert update |
| `--query <value>` | The query to run for retrieving information from sources, and for checking the alert. If you have defined one or more reports, specify each report's individual query in the report prompt. [body, string\|null, optional] |
| `--sources <value>` | The sources to use for retrieving information related to the alert query. Available sources are: AskNewsSource, TelegramSource, BlueskySource, WebSource, DeepNewsSource [body, array\|null, optional] |
| `--alert-type <value>` | The type of alert. If specified, overrides `repeat` and `always_trigger`. 'AlwaysAlertWhen': trigger alert actions any time the alert query is satisfied (`repeat=True`, `always_trigger=False`). Add Report model if you want a report when this is triggered. 'AlertOnceIf': trigger alert actions when the alert query is satisfied and then disable the alert (`repeat=False`, `always_trigger=False`). Add Report model if you want a report when this is triggered. 'ReportAbout': always trigger alert actions according to cron schedule and write a report (`repeat=True`, `always_trigger=True`). Defaults to using DeepNews for the report unless specified. [body, string\|null, optional] Choices: AlwaysAlertWhen, AlertOnceIf, ReportAbout. |
| `--model <value>` | The model that is used to check if the alert conditions are satisfied by sources (this is not the same as the model used to write the report.) [body, string\|null, optional] Choices: meta-llama/Meta-Llama-3.1-8B-Instruct, gpt-4o-mini, gpt-5-mini, gpt-5-nano, gpt-4o, o3-mini, meta-llama/Meta-Llama-3.3-70B-Instruct, gpt-4.1-2025-04-14, gpt-4.1-nano-2025-04-14, gpt-4.1-mini-2025-04-14, claude-sonnet-5. |
| `--cron <value>` | How often or when to check sources for this alert, specified as a cron expression. Examples: '0 * * * *' (hourly), '0 9 * * *' (daily at 9am), '0 9 * * 1' (Mondays at 9am). See https://crontab.run/ for more examples. [body, string\|null, optional] |
| `--triggers <value>` | Configuration for actions to trigger for the alert. Available actions are: WebhookAction, EmailAction, ResendBroadcastAction, GoogleDocsAction [body, array\|null, optional] |
| `--always-trigger [boolean]` | Whether to always trigger the actions when sources are scanned. This skips the check for if the alert conditions are satisfied and run triggers immediately. Defaults to False. [body, boolean\|null, optional] |
| `--repeat [boolean]` | Whether to repeat the alert. Default is True. If False, the alert will be disabled after it triggers once. [body, boolean\|null, optional] |
| `--active [boolean]` | Whether the alert is active or not. Default is True. [body, boolean\|null, optional] |
| `--expires-at <value>` | The expiration date for the alert. Default is None. If set, the alert will be disabled after this date. [body, string\|null, optional] |
| `--report <value>` | Configuration for generating a written report when the alert triggers. If report is a list, the individual reports will be concatenated into one report in the order they are defined. If not specified, no report is generated. Use ReportRequest(identifier='deepnews', ...) for DeepNews reports.Use ReportRequest(...) or ReportRequest(identifier='legacy', ...) for legacy reports (DEPRECATED). Requests without identifier default to 'deepnews'. Only DeepNews reports can be used in list. [body, object\|array\|null, optional] |
| `--title <value>` | The title of the alert. If not provided, no title will be used. [body, string\|null, optional] |
| `--share-link <value>` | The newsplunker share link to update when the alert triggers. [body, string\|null, optional] |

### `asknews alerts delete <alert-id>`

Delete an alert

**Arguments:**

| Argument | Description |
| --- | --- |
| `<alert-id>` | alert UUID |

**Options:**

| Option | Description |
| --- | --- |
| `-y, --yes` | confirm alert deletion |

### `asknews alerts run <alert-id>`

Run an existing alert

**Arguments:**

| Argument | Description |
| --- | --- |
| `<alert-id>` | alert UUID |

**Options:**

| Option | Description |
| --- | --- |
| `-y, --yes` | confirm billable alert run |
| `--user-id <value>` | The ID of the user to get logs for [query, string, optional] |
| `--is-test [boolean]` | Whether this is a test run [query, boolean, optional, default: false] |

## Global options

All commands support `--output human|table|json|jsonl|yaml`, `--json`, API/auth URL
overrides, request timeout, and color control. Result data is written to stdout; diagnostics
are written to stderr.
