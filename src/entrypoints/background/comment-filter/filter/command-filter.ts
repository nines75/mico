import { Thread } from "@/types/api/comment.types.js";
import { Settings } from "@/types/storage/settings.types.js";
import { CustomFilter } from "../filter.js";
import { countCommonLog, pushCommonLog } from "@/utils/util.js";
import { CommonLog } from "@/types/storage/log.types.js";
import { CustomRuleData, CustomRule, parseCustomFilter } from "../../filter.js";

interface NgCommandData extends CustomRuleData<NgCommand> {
    hasAll: boolean;
}

interface NgCommand extends CustomRule {
    rule: string;
    isDisable: boolean;
}

export class CommandFilter extends CustomFilter<CommonLog> {
    private disableCount = 0;
    protected filter: NgCommandData;
    protected log: CommonLog = new Map();

    constructor(settings: Settings, ngUserIds: Set<string>) {
        super(settings, ngUserIds);

        this.filter = this.createFilter(settings);
    }

    override filtering(threads: Thread[], isStrictOnly = false): void {
        const rules = isStrictOnly
            ? this.filter.rules.filter((rule) => this.isStrict(rule))
            : this.filter.rules.filter((rule) => !this.isStrict(rule));
        const { hasAll } = this.filter;

        if (rules.length === 0 && !hasAll) return;

        threads.forEach((thread) => {
            thread.comments = thread.comments.filter((comment) => {
                if (this.isIgnoreByNicoru(comment)) return true;

                // コマンドを小文字に変換し重複を排除
                comment.commands = [
                    ...new Set(
                        comment.commands.map((command) =>
                            command.toLowerCase(),
                        ),
                    ),
                ];

                // コマンドを置き換えた後に定義しないと前の参照を持ってしまう
                const { id, commands, userId } = comment;

                for (const { rule, isDisable } of rules) {
                    // commandsを内部で変更するのでコピーを作る
                    for (const command of [...commands]) {
                        if (rule !== command) continue;

                        if (isDisable) {
                            // allルールがある場合は後からまとめて無効化する
                            if (hasAll) break;

                            const index = commands.indexOf(command);
                            if (index !== -1) {
                                commands.splice(index, 1);
                                this.disableCount++;
                            }

                            break; // commandsに重複はないため、一致した時点でループを抜ける
                        } else {
                            if (isStrictOnly) {
                                if (!this.ngUserIds.has(userId)) {
                                    this.strictNgUserIds.push(userId);
                                }

                                return true;
                            }

                            pushCommonLog(this.log, rule, id);
                            this.filteredComments.set(id, comment);

                            return false;
                        }
                    }
                }

                // 無効化ルールより非表示ルールを優先するので後から無効化する
                if (hasAll) {
                    this.disableCount += commands.length;
                    commands.length = 0; // コマンド配列を空にする
                }

                return true;
            });
        });
    }

    override sortLog(): void {
        const ngCommands = new Set(
            this.filter.rules.map((ngCommand) => ngCommand.rule),
        );

        this.log = this.sortCommonLog(this.log, ngCommands);
    }

    override getCount(): number {
        return countCommonLog(this.log);
    }

    getDisableCount(): number {
        return this.disableCount;
    }

    createFilter(settings: Settings): NgCommandData {
        let hasAll = false;
        const ngCommands = parseCustomFilter(settings.ngCommand)
            .map((data): NgCommand => {
                return {
                    rule: data.rule.toLowerCase(),
                    isStrict: data.isStrict,
                    isDisable: data.isDisable,
                    include: data.include,
                    exclude: data.exclude,
                };
            })
            .filter((ngCommand) => {
                if (ngCommand.rule === "all" && ngCommand.isDisable) {
                    hasAll = true;

                    return false;
                }

                return true;
            });

        return {
            rules: ngCommands,
            hasAll,
        };
    }

    isStrict(rule: NgCommand): boolean {
        // strictルールと無効化ルールが併用されている場合、strictルールを無視する
        return rule.isStrict && !rule.isDisable;
    }
}
