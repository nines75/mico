import type { Thread } from "@/types/api/comment-api.types";
import type { Settings } from "@/types/storage/settings.types";
import { isString } from "@/utils/util";
import { StrictFilter } from "../strict-filter";

export class CommandsFilter extends StrictFilter {
  private removedCount = 0;

  constructor(settings: Settings) {
    super(settings, "commentCommands");

    this.rules = this.rules.map((rule) => {
      const pattern = rule.pattern;

      return {
        ...rule,
        pattern: isString(pattern) ? pattern.toLowerCase() : pattern,
      };
    });
  }

  getRemovedCount(): number {
    return this.removedCount;
  }

  override apply(threads: Thread[], strictOnly = false): void {
    const rules = this.rules
      .filter((rule) => {
        // strictルールとremoveルールが併用されている場合、strictルールを無視する
        const isStrict = rule.strict && !rule.remove;

        return strictOnly ? isStrict : !isStrict;
      })
      // removeルールを後から適用するためにソート
      .toSorted((a, b) => {
        if (a.remove === b.remove) return 0;

        return a.remove ? 1 : -1;
      });
    if (rules.length === 0) return;

    this.traverseThreads(threads, (comment) => {
      // コマンドを小文字に変換し重複を排除
      comment.commands = [
        ...new Set(comment.commands.map((command) => command.toLowerCase())),
      ];

      // 前の参照を持たないようコマンドを置き換えた後に定義する
      const { commands, userId } = comment;
      const commandsToRemove = new Set<string>();

      for (const { pattern, remove } of rules) {
        for (const command of commands) {
          if (isString(pattern) ? pattern !== command : !pattern.test(command))
            continue;

          if (strictOnly) {
            if (!this.userIds.has(userId)) {
              this.strictData.push({
                userId,
                context: `comment-commands: ${command}`,
              });
            }

            return true;
          }

          if (remove) {
            commandsToRemove.add(command);

            continue;
          }

          this.filteredComments.push({ comment, pattern, target: "commands" });

          return false;
        }
      }

      if (strictOnly) return true;

      // forループ内で配列を変更するのは危険なので後から除去する
      if (commandsToRemove.size > 0) {
        comment.commands = commands.filter((command) => {
          const isMatch = commandsToRemove.has(command);
          if (isMatch) this.removedCount++;

          return !isMatch;
        });
      }

      return true;
    });
  }
}
