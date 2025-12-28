import { Thread } from "@/types/api/comment.types.js";
import { Settings } from "@/types/storage/settings.types.js";
import { isString, pushCommonLog } from "@/utils/util.js";
import { CommonLog } from "@/types/storage/log.types.js";
import { Rule } from "../../filter.js";
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

            for (const { rule, isDisable } of rules) {
                // commandsを内部で変更するのでコピーを作る
                for (const command of [...commands]) {
                    if (isString(rule) ? rule !== command : !rule.test(command))
                        continue;

                    if (isDisable) {
                        // allルールがある場合は後からまとめて無効化する
                        if (this.hasAll) break;

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
            if (this.hasAll) {
                this.disableCount += commands.length;
                commands.length = 0; // コマンド配列を空にする
            }

            return true;
        });
    }

    override sortLog(): void {
        const ngCommands = new Set(
            this.rules.map(({ rule }) => this.createKey(rule)),
        );

        this.log = this.sortCommonLog(this.log, ngCommands);
    }

    isStrict(rule: Rule): boolean {
        // strictルールと無効化ルールが併用されている場合、strictルールを無視する
        return rule.isStrict && !rule.isDisable;
    }
}
