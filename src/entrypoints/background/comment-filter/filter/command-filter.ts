import { Thread } from "@/types/api/comment.types.js";
import { Settings } from "@/types/storage/settings.types.js";
import { StrictFilter } from "../filter.js";
import { isString, pushCommonLog } from "@/utils/util.js";
import { CommonLog } from "@/types/storage/log.types.js";
import { RuleData, parseFilter, Rule } from "../../filter.js";

interface CommandRuleData extends RuleData {
    hasAll: boolean;
}

export class CommandFilter extends StrictFilter<CommonLog> {
    private disableCount = 0;
    protected filter: CommandRuleData;
    protected log: CommonLog = new Map();

    constructor(settings: Settings, ngUserIds: Set<string>) {
        super(settings, ngUserIds);

        this.filter = this.createFilter(settings);
    }

    getDisableCount(): number {
        return this.disableCount;
    }

    override filtering(threads: Thread[], isStrictOnly = false): void {
        const { hasAll } = this.filter;
        const rules = isStrictOnly
            ? this.filter.rules.filter((rule) => this.isStrict(rule))
            : this.filter.rules
                  .filter((rule) => !this.isStrict(rule))
                  // 非表示ルールを無効化ルールより先に適用するためにソート
                  .sort((a, b) => {
                      if (a.isDisable === b.isDisable) return 0;
                      return a.isDisable ? 1 : -1;
                  });

        if (rules.length === 0 && !hasAll) return;

        this.traverseThreads(threads, (comment) => {
            // コマンドを小文字に変換し重複を排除
            comment.commands = [
                ...new Set(
                    comment.commands.map((command) => command.toLowerCase()),
                ),
            ];

            // コマンドを置き換えた後に定義しないと前の参照を持ってしまう
            const { id, commands, userId } = comment;

            for (const { rule, isDisable } of rules) {
                // commandsを内部で変更するのでコピーを作る
                for (const command of [...commands]) {
                    if (isString(rule) ? rule !== command : !rule.test(command))
                        continue;

                    if (isDisable) {
                        // allルールがある場合は後からまとめて無効化する
                        if (hasAll) break;

                        const index = commands.indexOf(command);
                        if (index !== -1) {
                            commands.splice(index, 1);
                            this.disableCount++;
                        }

                        break; // commandsに重複はないため、一致した時点でループを抜ける
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

            // 無効化ルールより非表示ルールを優先するので後から無効化する
            if (hasAll) {
                this.disableCount += commands.length;
                commands.length = 0; // コマンド配列を空にする
            }

            return true;
        });
    }

    override sortLog(): void {
        const ngCommands = new Set(
            this.filter.rules.map(({ rule }) => this.createKey(rule)),
        );

        this.log = this.sortCommonLog(this.log, ngCommands);
    }

    createFilter(settings: Settings): CommandRuleData {
        const parsedFilter = parseFilter(settings.ngCommand);
        this.invalidCount += parsedFilter.invalid;

        let hasAll = false;
        const rules = parsedFilter.rules
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

        return {
            rules,
            hasAll,
        };
    }

    isStrict(rule: Rule): boolean {
        // strictルールと無効化ルールが併用されている場合、strictルールを無視する
        return rule.isStrict && !rule.isDisable;
    }
}
