import { type Command, Option } from "commander";
import { UsageError } from "../lib/errors.js";
import { parseBodyInput } from "../lib/http.js";
import { getOperation } from "../lib/operations.js";
import {
  readRegisteredOptions,
  registerBodyOptions,
  registerCuratedParameterOptions,
  registerParameterOptions,
} from "../lib/schema-options.js";
import { confirmMutation, invokeOperation, invokeStreamingOperation } from "./api.js";
import { contextFrom } from "./context.js";

export function registerCuratedCommands(program: Command): void {
  registerNews(program);
  registerStories(program);
  registerResearch(program);
  registerSearch(program);
  registerAlerts(program);
}

function registerNews(program: Command): void {
  const news = program.command("news").description("Search and inspect AskNews articles");
  const search = news
    .command("search")
    .description("Search enriched real-time or historical news")
    .argument(
      "[query]",
      "Query string that can be any phrase, keyword, question, or paragraph. This is a semantic search, so natural language is supported, but keywords are prioritized. Keywords present in this query will help attract news that contain those same keywords. There is some internal keyword expansion that helps find more relevant news as well. If you need string keyword/entity constraints, use the string_guarantee or entity_guarantee parameters below.",
      "",
    )
    .option(
      "-n, --limit <number>",
      "The number of articles to return. Depends on your plan but it is usually 10. If you need more, you should use the offset parameter from a previous response to paginate through results.",
      "10",
    );
  // Curated surface mirrors the MCP search_news tool (same parameters, same
  // descriptions); the full schema-driven surface stays on `asknews api news search-news`.
  const options = registerCuratedParameterOptions(search, getOperation("search_news"), {
    time_filter: {
      description:
        "Control which date type to filter on. 'crawl_date' is the date the article was crawled, 'pub_date' is the date the article was published.",
      default: "pub_date",
    },
    offset: {
      description:
        "Offset for pagination. This value is stored in response.offset from previous search responses. Put that value here and run the query again to get the next page of results.",
    },
    categories: {
      description:
        "The list of categories that the articles in the search results should belong to. If None, then no category filtering will be applied (all categories allowed).",
      choices: [
        "All",
        "Business",
        "Economy",
        "Crime",
        "Politics",
        "Science",
        "Sports",
        "Technology",
        "Military",
        "Health",
        "Entertainment",
        "Finance",
        "Culture",
        "Climate",
        "Environment",
        "World",
      ],
    },
    provocative: {
      description:
        "Filter articles based on how provocative they are deemed based on the use of provocative language and emotional vocabulary. If None, then no provocative filtering will be applied (all levels allowed).",
    },
    reporting_voice: {
      description:
        "The type of reporting voice that the original article used in its writing style. If None, then no reporting voice filtering will be applied (all types allowed).",
      type: "array",
      itemType: "string",
      choices: [
        "Objective",
        "Subjective",
        "Investigative",
        "Narrative",
        "Analytical",
        "Advocacy",
        "Conversational",
        "Satirical",
        "Emotive",
        "Explanatory",
        "Persuasive",
        "Sensational",
        "Unknown",
        "all",
      ],
    },
    domain_url: {
      description:
        "Filter by domain url of interest. This can be a single domain or a list of domains. For example, ['npr.org'] or ['apnews.com', 'nature.com', 'npr.org', 'telegraph.co.uk']. If None, then no domain filtering will be applied (all domains allowed).",
      type: "array",
      itemType: "string",
    },
    bad_domain_url: {
      description:
        "Blacklist of domains that must be excluded from results. This can be a single domain url or a list of domain urls.",
      type: "array",
      itemType: "string",
    },
    page_rank: {
      description:
        "Maximum allowed page rank for returned articles. Use this to focus on higher quality sources, lower page rank means higher quality. Usually 100000 or lower will target top sources. But this can go up to 10_000_000.",
      type: "integer",
    },
    hours_back: {
      description:
        "This controls the historical cut off for the search. For example, setting this to 24 means that the search will only occur on articles from the last 24 hours. It can be set up to 3840 hours (which is 160 days). The time_filter parameters controls whether this will be on the pub_date or crawl_date.",
    },
  });
  search
    .addOption(
      new Option(
        "--start-datetime <iso>",
        "Start datetime for filtering articles (ISO 8601, e.g. '2026-01-01T00:00:00Z'). Alternative to hours_back. If provided with end_datetime, takes precedence over hours_back. start_datetime and end_datetime must be less than 160 days apart. If only start_datetime is provided, end_datetime defaults to now. For ranges >160 days, split into multiple searches.",
      ).helpGroup("API options:"),
    )
    .addOption(
      new Option(
        "--end-datetime <iso>",
        "End datetime for filtering articles (ISO 8601, e.g. '2025-01-31T23:59:59Z'). Alternative to hours_back. If provided with start_datetime, takes precedence over hours_back. start_datetime and end_datetime must be less than 160 days apart. For ranges >160 days, split into multiple searches.",
      ).helpGroup("API options:"),
    );
  const filterOptions = registerCuratedParameterOptions(search, getOperation("search_news"), {
    string_guarantee: {
      description:
        "If defined, the search will only occur on articles that contain strings in this list. For example, ['climate change', 'global warming'] will constrain the search to only articles that contain these phrases. Very good for targeted searches, where a certain keyword must be present. This is optional.",
      type: "array",
      itemType: "string",
    },
    string_guarantee_op: {
      description: "Operator to use for string guarantee list.",
    },
    reverse_string_guarantee: {
      description:
        "If defined, the search will only occur on articles that do not contain strings in this list. This is powerful for avoiding articles with a particular name or concept. It is optional.",
      type: "array",
      itemType: "string",
    },
    entity_guarantee: {
      description:
        "Entity(s) that *must* be present in the search results. This is a list of strings, where each string includes entity type and entity value separated by a colon. The first element is the entity type and the second element is the entity value. For example ['Location:Paris', 'Person:John McCartney', 'Product:Television', 'Sports:Broncos']. Allowed types are: Person, Organization, Location, Event, Date, Sports, Politics, Title, Arms, Product, Media, Transportation, Religion, Technology, Medicine, Language, Science",
      type: "array",
      itemType: "string",
    },
    entity_guarantee_op: {
      description: "Operator to use for entity guarantee list.",
    },
    reverse_entity_guarantee: {
      description:
        "Entities that can *NOT* be present in the search results. This is a list of strings where each string includes entity type and entity value separated by a colon. The first element is the entity type and the second element is the entity value. For example ['Location:Paris', 'Person:John']",
      type: "array",
      itemType: "string",
    },
    languages: {
      description:
        "Original article language to filter the search on. This is the two-letter 'set 1' of the ISO 639-1 standard. For example: English is 'en'. Please keep in mind that all data is returned in English, regardless of the original article language. This filter only controls which languages the original articles were written in.",
      type: "array",
      itemType: "string",
      choices: [
        "en",
        "de",
        "es",
        "fr",
        "it",
        "pt",
        "ru",
        "ar",
        "tr",
        "zh",
        "jp",
        "ko",
        "sv",
        "nl",
        "no",
        "da",
        "uk",
        "pl",
        "hi",
      ],
    },
    countries: {
      description:
        "Publisher countries to filter by (this is only for the publisher location, not the locations mentioned in articles. For Locations mentioned in articles, use entity_guarantee parameter with 'Location:'), countries must be the two-letter ISO country code. For example: United States is 'US', France is 'FR', Sweden is 'SE'.",
      type: "array",
      itemType: "string",
    },
    countries_blacklist: {
      description:
        "Source countries to blacklist from search (this is only for the publisher location, not the locations mentioned in articles. For Locations mentioned in articles, use reverse_entity_guarantee parameter with 'Location:'), countries must be the two-letter ISO country code. For example: United States is 'US', France is 'FR', Sweden is 'SE'.",
      type: "array",
      itemType: "string",
    },
    continents: {
      description:
        "Filter on articles where the content is most related to continents in this list.",
      type: "array",
      itemType: "string",
      choices: [
        "Africa",
        "Asia",
        "Oceania",
        "Europe",
        "Middle East",
        "North America",
        "South America",
      ],
    },
    sentiment: {
      description: "Sentiment to filter articles on.",
      choices: ["negative", "neutral", "positive"],
    },
    authors: {
      description: "Authors to filter articles by.",
      type: "array",
      itemType: "string",
    },
    return_type: {
      description:
        "Format to return articles in. 'dicts' returns a list of article dictionaries with full metadata. 'string' returns a prompt-optimized string format. String is good for accepting concise input into LLMs, dicts is good for detailed analysis and using large json objects for further processing.",
      choices: ["string", "dicts"],
    },
  });
  options.push(...filterOptions);
  addUnderlyingHelp(search, "search_news");
  search.action(
    async (
      query: string,
      values: { limit: string; startDatetime?: string; endDatetime?: string },
      command,
    ) => {
      const parameters = readRegisteredOptions(command, options);
      // MCP parity: the server default is crawl_date, and premium is always on.
      parameters.time_filter ??= "pub_date";
      parameters.premium = true;
      if (values.startDatetime) {
        parameters.start_timestamp = toUnixSeconds(values.startDatetime, "--start-datetime");
      }
      if (values.endDatetime) {
        parameters.end_timestamp = toUnixSeconds(values.endDatetime, "--end-datetime");
      }
      await invokeOperation(command, "search_news", {
        ...parameters,
        query,
        n_articles: Number(values.limit),
      });
    },
  );

  const get = news
    .command("get")
    .description("Get an article by ID")
    .argument("<article-id>", "AskNews article UUID");
  addUnderlyingHelp(get, "get_article");
  get.action(async (articleId: string, _options, command) => {
    await invokeOperation(command, "get_article", { article_id: articleId });
  });
}

function registerStories(program: Command): void {
  const stories = program.command("stories").description("Search and inspect news stories");
  const list = stories
    .command("list")
    .description("List or search stories")
    .option("-q, --query <query>", "story search query")
    .option("-n, --limit <number>", "number of stories", "10")
    .option("--hours-back <hours>", "convenience alias for --start-timestamp");
  const listOptions = registerParameterOptions(
    list,
    getOperation("get_stories"),
    new Set(["query", "limit"]),
  );
  addUnderlyingHelp(list, "get_stories");
  list.action(
    async (values: { query?: string; limit: string; hoursBack?: string }, command: Command) => {
      const parameters = readRegisteredOptions(command, listOptions);
      if (values.hoursBack && parameters.start_timestamp === undefined) {
        parameters.start_timestamp =
          Math.floor(Date.now() / 1000) - Number(values.hoursBack) * 60 * 60;
      }
      parameters.expand_updates ??= true;
      parameters.max_updates ??= 1;
      parameters.max_articles ??= 0;
      await invokeOperation(command, "get_stories", {
        ...parameters,
        limit: Number(values.limit),
        ...(values.query ? { query: values.query } : {}),
      });
    },
  );

  const get = stories
    .command("get")
    .description("Get a story or story update")
    .argument("<story-id>", "story or update UUID");
  const getOptions = registerParameterOptions(
    get,
    getOperation("get_story"),
    new Set(["story_id"]),
  );
  addUnderlyingHelp(get, "get_story");
  get.action(async (storyId: string, _options, command) => {
    await invokeOperation(command, "get_story", {
      ...readRegisteredOptions(command, getOptions),
      story_id: storyId,
    });
  });
}

function registerResearch(program: Command): void {
  const research = program
    .command("research")
    .description("Run DeepNews research")
    .argument("[query]", "research task or question");
  const bodyOptions = registerBodyOptions(
    research,
    getOperation("deep_news"),
    new Set(["messages"]),
  );
  addUnderlyingHelp(research, "deep_news", [
    "asknews research models",
    'asknews research "What changed in AI regulation?" --model claude-sonnet-4-6',
    'asknews research "Compare policy reactions" --sources asknews --sources reddit --stream',
  ]);
  research.addHelpText(
    "after",
    `
DeepNews research can run for several minutes; how long depends on the query, the sources
involved, and the search depth. Streaming is the default (--stream true) whenever the output
format supports it (human or jsonl): results render as they arrive and the request timeout
only bounds inactivity between events, not total duration. With --stream false or a
non-streaming output format (json, table, yaml) the full response arrives only when research
completes, so the timeout must cover the whole run — it defaults to 900000 ms (15 minutes)
for this command. Raise --timeout for especially deep multi-source runs.
`,
  );
  research.action(async (query: string | undefined, _options, command) => {
    if (!query) throw new UsageError("Research query is required; see `asknews research --help`");
    const body: Record<string, unknown> = {
      messages: [{ role: "user", content: query }],
      ...readRegisteredOptions(command, bodyOptions),
    };
    if (body.stream === undefined) {
      // Stream by default so long research renders as it happens, but only for output
      // formats the streaming path supports; json/table/yaml keep the buffered response.
      const { writer } = contextFrom(command);
      if (writer.format === "human" || writer.format === "jsonl") body.stream = true;
    }
    if (body.stream === true) {
      await invokeStreamingOperation(command, "deep_news", {}, body);
      return;
    }
    await invokeOperation(command, "deep_news", {}, body);
  });

  research
    .command("models")
    .description("List DeepNews models available to the authenticated account")
    .addHelpText(
      "after",
      `
The OpenAPI schema lists every accepted model identifier in \`asknews research --help\`.
This command calls the account-aware model endpoint and shows the currently available tier.
`,
    )
    .action(async (_options, command) => {
      await invokeOperation(command, "list_deepnews_models", {});
    });
}

function registerSearch(program: Command): void {
  const web = program
    .command("web")
    .description("Search the live web")
    .argument("<query>", "web search query")
    .option("--hours-back <hours>", "compatibility alias for --lookback");
  const webOptions = registerParameterOptions(
    web,
    getOperation("live_web_search"),
    new Set(["queries"]),
  );
  addUnderlyingHelp(web, "live_web_search");
  web.action(async (query: string, values: { hoursBack?: string }, command) => {
    const parameters = readRegisteredOptions(command, webOptions);
    if (values.hoursBack && parameters.lookback === undefined) {
      parameters.lookback = Number(values.hoursBack);
    }
    await invokeOperation(command, "live_web_search", {
      ...parameters,
      queries: [query],
    });
  });

  const reddit = program
    .command("reddit")
    .description("Search Reddit threads")
    .argument("<query>", "Reddit search query")
    .option("-n, --limit <number>", "alias for --n-threads", "10");
  const redditOptions = registerParameterOptions(
    reddit,
    getOperation("search_reddit"),
    new Set(["keywords", "n_threads"]),
  );
  addUnderlyingHelp(reddit, "search_reddit");
  reddit.action(async (query: string, values: { limit: string }, command) => {
    await invokeOperation(command, "search_reddit", {
      ...readRegisteredOptions(command, redditOptions),
      keywords: [query],
      n_threads: Number(values.limit),
    });
  });

  const wiki = program
    .command("wiki")
    .description("Search Wikipedia")
    .argument("<query>", "Wikipedia search query")
    .option("-n, --limit <number>", "alias for --n-documents", "10");
  const wikiOptions = registerParameterOptions(
    wiki,
    getOperation("search_wiki"),
    new Set(["query", "n_documents"]),
  );
  addUnderlyingHelp(wiki, "search_wiki");
  wiki.action(async (query: string, values: { limit: string }, command) => {
    await invokeOperation(command, "search_wiki", {
      ...readRegisteredOptions(command, wikiOptions),
      query,
      n_documents: Number(values.limit),
    });
  });

  // Mirrors the MCP search_x_twitter tool: live_web_search pinned to
  // domains=x.com and engine=v1.5 (there is no dedicated X endpoint).
  const x = program
    .command("x")
    .description("Search X (Twitter) with an advanced search expression")
    .argument(
      "<expression>",
      "Twitter/X Advanced Search expression using Twitter search syntax. Supports operators like: 'OR', 'AND', 'from:username', '@username', 'since:YYYY-MM-DD_HH:MM:SS_UTC', 'until:YYYY-MM-DD_HH:MM:SS_UTC', '#hashtag', 'filter:links', 'filter:media', etc. Example: '(bitcoin OR ethereum) AND (crash OR rally OR @elonmusk) from:elonmusk min_faves:100 -filter:replies'. You can also use lookback parameter instead of since/until for relative time filtering.",
    );
  const xOptions = registerCuratedParameterOptions(x, getOperation("live_web_search"), {
    lookback: {
      description:
        "Number of hours back to allow the search to look. Defaults to all time if not specified. Use this to constrain results to recent tweets.",
    },
    start_datetime: {
      description:
        "Start datetime for filtering results (ISO 8601, e.g. '2026-01-01T00:00:00Z'). Alternative to lookback. If provided with end_datetime, takes precedence over lookback. start_datetime and end_datetime must be less than 160 days apart. For ranges >160 days, split into multiple searches.",
    },
    end_datetime: {
      description:
        "End datetime for filtering results (ISO 8601, e.g. '2025-01-31T23:59:59Z'). Alternative to lookback. If provided with start_datetime, takes precedence over lookback. start_datetime and end_datetime must be less than 160 days apart. For ranges >160 days, split into multiple searches.",
    },
    offset: {
      description:
        "Opaque pagination cursor for followup queries. X (Twitter) searches return it in response.offset — pass it back here unchanged to fetch the next page.",
    },
  });
  x.addOption(
    new Option(
      "--return-type <format>",
      "Format to return results in. 'dicts' returns a list of result dictionaries with full metadata. 'string' returns a prompt-optimized string format. String is good for accepting concise input into LLMs, dicts is good for detailed analysis and using large json objects for further processing.",
    )
      .choices(["string", "dicts"])
      .default("dicts")
      .helpGroup("API options:"),
  );
  x.addHelpText(
    "after",
    `
ADVANCED SEARCH SYNTAX
  Logical operators:  AND, OR
  User filters:       from:username, @username
  Date filters:       since:YYYY-MM-DD_HH:MM:SS_UTC, until:YYYY-MM-DD_HH:MM:SS_UTC
  Content filters:    #hashtag, filter:links, filter:media, filter:videos
  Engagement:         min_replies:N, min_faves:N, min_retweets:N
`,
  );
  addUnderlyingHelp(x, "live_web_search", [
    'asknews x "from:elonmusk min_faves:100 -filter:replies" --lookback 24 --output json',
    'asknews x "(bitcoin OR ethereum) AND (crash OR rally)" --start-datetime 2026-01-01T00:00:00Z --end-datetime 2026-01-31T00:00:00Z',
  ]);
  x.action(async (expression: string, values: { returnType: "string" | "dicts" }, command) => {
    await invokeOperation(
      command,
      "live_web_search",
      {
        ...readRegisteredOptions(command, xOptions),
        queries: [expression],
        domains: "x.com",
        engine: "v1.5",
      },
      undefined,
      trimWebSearchResponse(values.returnType),
    );
  });
}

function registerAlerts(program: Command): void {
  const alerts = program.command("alerts").description("Create and manage AskNews alerts");

  const list = alerts.command("list").description("List alerts");
  const listOptions = registerParameterOptions(list, getOperation("get_alerts"));
  addUnderlyingHelp(list, "get_alerts");
  list.action(async (_options, command) => {
    await invokeOperation(command, "get_alerts", readRegisteredOptions(command, listOptions));
  });

  const get = alerts
    .command("get")
    .description("Get an alert")
    .argument("<alert-id>", "alert UUID");
  const getOptions = registerParameterOptions(
    get,
    getOperation("get_alert"),
    new Set(["alert_id"]),
  );
  addUnderlyingHelp(get, "get_alert");
  get.action(async (alertId: string, _options, command) => {
    await invokeOperation(command, "get_alert", {
      ...readRegisteredOptions(command, getOptions),
      alert_id: alertId,
    });
  });

  registerAlertWrite(alerts, "create", "create_alert");
  registerAlertWrite(alerts, "update", "put_alert", true);

  const remove = alerts
    .command("delete")
    .description("Delete an alert")
    .argument("<alert-id>", "alert UUID")
    .option("-y, --yes", "confirm alert deletion");
  addUnderlyingHelp(remove, "delete_alert");
  remove.action(async (alertId: string, values: { yes?: boolean }, command) => {
    await confirmMutation(getOperation("delete_alert"), Boolean(values.yes));
    await invokeOperation(command, "delete_alert", { alert_id: alertId });
  });

  const run = alerts
    .command("run")
    .description("Run an existing alert")
    .argument("<alert-id>", "alert UUID")
    .option("-y, --yes", "confirm billable alert run");
  const runOptions = registerParameterOptions(
    run,
    getOperation("run_alert"),
    new Set(["alert_id"]),
  );
  addUnderlyingHelp(run, "run_alert");
  run.action(async (alertId: string, values: { yes?: boolean }, command) => {
    await confirmMutation(getOperation("run_alert"), Boolean(values.yes));
    await invokeOperation(command, "run_alert", {
      ...readRegisteredOptions(command, runOptions),
      alert_id: alertId,
    });
  });
}

function registerAlertWrite(
  alerts: Command,
  name: "create" | "update",
  operationId: "create_alert" | "put_alert",
  hasId = false,
): void {
  const operation = getOperation(operationId);
  const command = alerts.command(name).description(operation.summary);
  if (hasId) command.argument("<alert-id>", "alert UUID");
  command
    .option("--body <json-or-file>", "complete alert JSON or @file.json")
    .option("-y, --yes", `confirm alert ${name}`);
  const fields = registerBodyOptions(command, operation);
  addUnderlyingHelp(command, operationId);
  command.action(async (...args: unknown[]) => {
    const actionCommand = args.at(-1) as Command;
    const values = args.at(-2) as { body?: string; yes?: boolean };
    const alertId = hasId ? (args[0] as string) : undefined;
    await confirmMutation(operation, Boolean(values.yes));
    const bodyInput = await parseBodyInput(values.body);
    const body = {
      ...(isRecord(bodyInput) ? bodyInput : {}),
      ...readRegisteredOptions(actionCommand, fields),
    };
    if (Object.keys(body).length === 0) {
      throw new UsageError(`Pass alert fields or --body; see \`asknews alerts ${name} --help\``);
    }
    await invokeOperation(actionCommand, operationId, alertId ? { alert_id: alertId } : {}, body);
  });
}

function addUnderlyingHelp(command: Command, operationId: string, examples: string[] = []): void {
  const operation = getOperation(operationId);
  const safety =
    operation.safety === "mutating"
      ? "state-changing; confirmation required"
      : operation.safety === "high-cost"
        ? "read-only but potentially billable/high-cost"
        : "read-only";
  command.addHelpText(
    "after",
    `
API CONTRACT
  Operation: ${operation.operationId}
  Request:   ${operation.method} ${operation.path}
  Safety:    ${safety}
${examples.length > 0 ? `\nEXAMPLES\n${examples.map((example) => `  ${example}`).join("\n")}` : ""}
`,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function toUnixSeconds(value: string, flag: string): number {
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) {
    throw new UsageError(`${flag} expects an ISO 8601 datetime, e.g. 2026-01-01T00:00:00Z`);
  }
  return Math.floor(ms / 1000);
}

function trimWebSearchResponse(returnType: "string" | "dicts"): (data: unknown) => unknown {
  return (data) => {
    if (!isRecord(data)) return data;
    if (returnType === "string") return "as_dicts" in data ? { ...data, as_dicts: [] } : data;
    return "as_string" in data ? { ...data, as_string: "" } : data;
  };
}
