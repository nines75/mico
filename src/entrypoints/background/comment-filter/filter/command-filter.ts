import type { Thread } from "@/types/api/comment.types.js";
import type { Settings } from "@/types/storage/settings.types.js";
import { isString, pushCommonLog } from "@/utils/util.js";
import type { CommonLog } from "@/types/storage/log.types.js";
import type { Rule } from "../../filter.js";
import { StrictFilter } from "../strict-filter.js";

export class CommandFilter extends StrictFilter<CommonLog> {
    private hasAll: boolean;
    private disableCount = 0;
    protected log: CommonLog = new Map();

    constructor(settings: Settings, ngUserIds: Set<string>) {
        super(settings, ngUserIds, settings.ngCommand);

        let hasAll = false;
        const rules = this.rules
            .map((data) => {
                const rule = data.rule;
                return {
                    ...data,
                    rule: isString(rule) ? rule.toLowerCase() : rule,
                };
            })
            .filter((data) => {
                if (data.rule === "all" && data.isDisable) {
                    hasAll = true;

                    return false;
                }

                return true;
            });

        this.rules = rules;
        this.hasAll = hasAll;
    }

    getDisableCount(): number {
        return this.disableCount;
    }

    override filtering(threads: Thread[], isStrictOnly = false): void {
        const rules = isStrictOnly
            ? this.rules.filter((rule) => this.isStrict(rule))
            : this.rules
                  .filter((rule) => !this.isStrict(rule))
                  // 非表示ルールを無効化ルールより先に適用するためにソート
                  .sort((a, b) => {
                      if (a.isDisable === b.isDisable) return 0;
                      return a.isDisable ? 1 : -1;
                  });

        if (rules.length === 0 && !this.hasAll) return;

        this.traverseThreads(threads, (comment) => {
            // コマンドを小文字に変換し重複を排除
            comment.commands = [
                ...new Set(
                    comment.commands.map((command) => command.toLowerCase()),
                ),
            ];

            // コマンドを置き換えた後に定義しないと前の参照を持ってしまう
            const { id, commands, userId } = comment;
            const disableCommands = new Set<string>();

            for (const { rule, isDisable } of rules) {
                for (const command of commands) {
                    if (isString(rule) ? rule !== command : !rule.test(command))
                        continue;

                    if (isDisable) {
                        if (this.hasAll) break;
                        disableCommands.add(command);

                        continue;
                    }

                    if (isStrictOnly) {
                        if (!this.ngUserIds.has(userId)) {
                            this.strictData.push({
                                userId,
                                context: `command(strict): ${command}`,
                            });
                        }

                        return true;
                    }

                    pushCommonLog(this.log, this.createKey(rule), id);
                    this.filteredComments.set(id, comment);
                    this.blockedCount++;

                    return false;
                }
            }

            // forループ内で配列を変更するのは危険なので後から無効化する
            if (this.hasAll) {
                comment.commands = [];
                this.disableCount += commands.length;
            } else {
                if (disableCommands.size > 0) {
                    comment.commands = commands.filter((command) => {
                        const isMatch = disableCommands.has(command);
                        if (isMatch) this.disableCount++;

                        return !isMatch;
                    });
                }
            }

            return true;
        });
    }

    override sortLog(): void {
        this.log = this.sortCommonLog(
            this.log,
            this.rules.map(({ rule }) => rule),
        );
    }

    isStrict(rule: Rule): boolean {
        // strictルールと無効化ルールが併用されている場合、strictルールを無視する
        return rule.isStrict && !rule.isDisable;
    }
}
