import type { Thread } from "@/types/api/comment-api.types";
import type { Settings } from "@/types/storage/settings.types";
import { isString } from "@/utils/util";
import { StrictFilter } from "../strict-filter";
import type { Rule } from "../../rule";

export class CommandsFilter extends StrictFilter {
    private disableCount = 0;

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

    getDisableCount(): number {
        return this.disableCount;
    }

    override apply(threads: Thread[], strictOnly = false): void {
        const rules = strictOnly
            ? this.rules.filter((rule) => this.isStrict(rule))
            : this.rules
                  .filter((rule) => !this.isStrict(rule))
                  // 無効化ルールを後から適用するためにソート
                  .toSorted((a, b) => {
                      if (a.disable === b.disable) return 0;
                      return a.disable ? 1 : -1;
                  });
        if (rules.length === 0) return;

        this.traverseThreads(threads, (comment) => {
            // コマンドを小文字に変換し重複を排除
            comment.commands = [
                ...new Set(
                    comment.commands.map((command) => command.toLowerCase()),
                ),
            ];

            // 前の参照を持たないようコマンドを置き換えた後に定義する
            const { commands, userId } = comment;
            const commandsToDisable = new Set<string>();

            for (const { pattern, disable } of rules) {
                for (const command of commands) {
                    if (
                        isString(pattern)
                            ? pattern !== command
                            : !pattern.test(command)
                    )
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

                    if (disable) {
                        commandsToDisable.add(command);

                        continue;
                    }

                    this.filteredComments.push({
                        comment,
                        pattern,
                        target: "commands",
                    });

                    return false;
                }
            }

            if (strictOnly) return true;

            // forループ内で配列を変更するのは危険なので後から無効化する
            if (commandsToDisable.size > 0) {
                comment.commands = commands.filter((command) => {
                    const isMatch = commandsToDisable.has(command);
                    if (isMatch) this.disableCount++;

                    return !isMatch;
                });
            }

            return true;
        });
    }

    isStrict(rule: Rule): boolean {
        // strictルールと無効化ルールが併用されている場合、strictルールを無視する
        return rule.strict && !rule.disable;
    }
}
