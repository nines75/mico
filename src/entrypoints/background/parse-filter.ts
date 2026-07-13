import { createDefaultRule, type Rule } from "./rule";

export type Directive =
  | {
      type:
        | "include-tags"
        | "include-video-ids"
        | "include-user-ids"
        | "include-series-ids"
        | "exclude-tags"
        | "exclude-video-ids"
        | "exclude-user-ids"
        | "exclude-series-ids";
      args: string[];
    }
  | {
      type:
        | "strict"
        | "disable"
        | "comment-user-id"
        | "comment-commands"
        | "comment-body"
        | "video-id"
        | "video-owner-id"
        | "video-owner-name"
        | "video-title";
    };

export const argsDirectives = [
  "include-tags",
  "include-video-ids",
  "include-user-ids",
  "include-series-ids",
  "exclude-tags",
  "exclude-video-ids",
  "exclude-user-ids",
  "exclude-series-ids",
] as const satisfies Extract<Directive, { args: string[] }>["type"][];

export const noArgsDirectives = [
  "strict",
  "disable",
  "comment-user-id",
  "comment-commands",
  "comment-body",
  "video-id",
  "video-owner-id",
  "video-owner-name",
  "video-title",
] as const satisfies Exclude<Directive, { args: string[] }>["type"][];

export interface InvalidLine {
  index: number;
  type: "directive" | "regex" | "regex_flag" | "args";
}

export function parseFilter(
  filter: string,
  includeIndex = false, // テストが複雑になるためindexはデフォルトで含めない
): { rules: Rule[]; invalidLines: InvalidLine[] } {
  let strictAlias = false;
  const directives: Directive[] = [];
  const rules: Rule[] = [];
  const invalidLines: InvalidLine[] = [];

  const lines = filter
    .split("\n")
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line !== "" && !line.startsWith("#"));

  lineLoop: for (const { line, index } of lines) {
    // -------------------------------------------------------------------------------------------
    // ディレクティブのパース
    // -------------------------------------------------------------------------------------------
    const trimmedLine = line.trimEnd();

    // 引数あり
    for (const directive of argsDirectives) {
      if (line === `@${directive}`) {
        invalidLines.push({ index, type: "args" });
        continue lineLoop;
      }

      if (new RegExp(String.raw`^@${directive}\s`).test(line)) {
        const args = parseArgs(line);
        if (args.length === 0) {
          invalidLines.push({ index, type: "args" });
          continue lineLoop;
        }

        directives.push({
          type: directive,
          args,
        });
        continue lineLoop;
      }
    }

    // 引数なし
    for (const directive of noArgsDirectives) {
      if (trimmedLine === `@${directive}`) {
        directives.push({ type: directive });
        continue lineLoop;
      }
    }
    if (trimmedLine === "@end") {
      directives.pop();
      continue;
    }
    if (trimmedLine === "@s") {
      strictAlias = true;
      continue;
    }

    // 有効なディレクティブでなくても@から始まる行はルールとして解釈しない
    if (line.startsWith("@")) {
      invalidLines.push({ index, type: "directive" });
      continue;
    }

    // -------------------------------------------------------------------------------------------
    // ルールに適用するディレクティブを決定
    // -------------------------------------------------------------------------------------------

    const rule = createDefaultRule();
    const { include, exclude } = rule;

    for (const directive of directives) {
      switch (directive.type) {
        // 引数あり(include)
        case "include-tags": {
          include.tags.push(directive.args);
          break;
        }
        case "include-video-ids": {
          include.videoIds.push(directive.args);
          break;
        }
        case "include-user-ids": {
          include.userIds.push(directive.args);
          break;
        }
        case "include-series-ids": {
          include.seriesIds.push(directive.args);
          break;
        }

        // 引数あり(exclude)
        case "exclude-tags": {
          exclude.tags.push(directive.args);
          break;
        }
        case "exclude-video-ids": {
          exclude.videoIds.push(directive.args);
          break;
        }
        case "exclude-user-ids": {
          exclude.userIds.push(directive.args);
          break;
        }
        case "exclude-series-ids": {
          exclude.seriesIds.push(directive.args);
          break;
        }

        // 引数なし
        case "strict": {
          rule.strict = true;
          break;
        }
        case "disable": {
          rule.disable = true;
          break;
        }

        // 引数なし(target)
        case "comment-user-id": {
          rule.target.commentUserId = true;
          break;
        }
        case "comment-commands": {
          rule.target.commentCommands = true;
          break;
        }
        case "comment-body": {
          rule.target.commentBody = true;
          break;
        }
        case "video-id": {
          rule.target.videoId = true;
          break;
        }
        case "video-owner-id": {
          rule.target.videoOwnerId = true;
          break;
        }
        case "video-owner-name": {
          rule.target.videoOwnerName = true;
          break;
        }
        case "video-title": {
          rule.target.videoTitle = true;
          break;
        }
      }
    }

    // エイリアスの適用
    if (strictAlias) {
      rule.strict = true;
      strictAlias = false;
    }

    // -------------------------------------------------------------------------------------------
    // ルールのパース
    // -------------------------------------------------------------------------------------------

    const results = /^\/(.*)\/([^/]*)$/.exec(line);

    const regexStr = results?.[1];
    const flags = results?.[2];

    let regex: RegExp | undefined;
    if (regexStr !== undefined && flags !== undefined) {
      // 想定外のフラグが含まれている場合はルールとして解釈しない
      if (!/^[isuvm]*$/.test(flags)) {
        invalidLines.push({ index, type: "regex_flag" });
        continue;
      }

      try {
        regex = new RegExp(regexStr, flags);
      } catch {
        invalidLines.push({ index, type: "regex" });
        continue;
      }
    }

    rules.push({
      pattern: regex ?? line,
      ...rule,
      ...(includeIndex && { index }),
    });
  }

  return { rules, invalidLines };
}

export function parseArgs(line: string) {
  return line
    .split(/\s+/)
    .slice(1)
    .filter((arg) => arg !== "")
    .map((arg) => arg.toLowerCase());
}
