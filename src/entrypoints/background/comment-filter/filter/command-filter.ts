import { Thread } from "@/types/api/comment.types.js";
import { Settings } from "@/types/storage/settings.types.js";
import { CommandLog } from "@/types/storage/log.types.js";
import { sortCommentId } from "../sort-log.js";
import {
    analyzeCustomRule,
    checkHasTagRule,
    CustomFilter,
    CustomRule,
    CustomRuleData,
} from "../filter.js";

interface NgCommandData extends CustomRuleData<NgCommand> {
    hasAll: boolean;
}

interface NgCommand extends CustomRule {
    rule: string;
    isDisable: boolean;
}

export class CommandFilter extends CustomFilter<CommandLog> {
    protected filter: NgCommandData;
    protected log: CommandLog = new Map();
    private disableCount = 0;

    constructor(settings: Settings, ngUserIds: Set<string>) {
        super(settings, ngUserIds);

        this.filter = getNgCommandData(settings);
    }

    filtering(threads: Thread[], isStrictOnly = false): void {
        const rules = isStrictOnly
            ? this.filter.rules.filter(
                  (rule) => rule.isStrict && !rule.isDisable, // strictルールと無効化ルールが併用されている場合、strictルールを無視する
              )
            : this.filter.rules.filter(
                  (rule) => !(rule.isStrict && !rule.isDisable),
              );

        if (rules.length === 0) return;

        const { hasAll } = this.filter;

        threads.forEach((thread) => {
            thread.comments = thread.comments.filter((comment) => {
                if (
                    this.settings.isIgnoreByNicoru &&
                    comment.nicoruCount >= this.settings.IgnoreByNicoruCount
                )
                    return true;

                // コマンドを小文字に変換し重複を排除
                comment.commands = [
                    ...new Set(
                        comment.commands.map((command) =>
                            command.toLowerCase(),
                        ),
                    ),
                ];

                // コマンドを置き換えた後に定義しないと前の参照を持ってしまう
                const { id, commands } = comment;

                for (const { rule, isDisable } of rules) {
                    // commandsを内部で変更するのでコピーを作る
                    for (const command of [...commands]) {
                        if (rule === command) {
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
                                    if (!this.ngUserIds.has(comment.userId)) {
                                        this.strictNgUserIds.push(
                                            comment.userId,
                                        );
                                    }

                                    return true;
                                }

                                if (this.log.has(rule)) {
                                    this.log.get(rule)?.push(id);
                                } else {
                                    this.log.set(rule, [id]);
                                }

                                this.filteredComments.set(comment.id, comment);

                                return false;
                            }
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

    protected sortLog(): void {
        const log: CommandLog = new Map();
        const ngCommands = getNgCommandSet(this.filter);

        // フィルター昇順にソート
        ngCommands.forEach((command) => {
            if (this.log.has(command)) {
                log.set(command, this.log.get(command) ?? []);
            }
        });

        this.log = log;

        // 各ルールのコメントをソート
        this.log.forEach((ids, command) => {
            this.log.set(
                command,
                this.settings.isShowNgScoreInLog
                    ? sortCommentId([...ids], this.filteredComments, true)
                    : sortCommentId([...ids], this.filteredComments),
            );
        });
    }

    getCount(): number {
        return this.log.values().reduce((sum, ids) => sum + ids.length, 0);
    }

    getDisableCount(): number {
        return this.disableCount;
    }
}

export function getNgCommandData(settings: Settings): NgCommandData {
    let hasAll = false;
    const ngCommands = analyzeCustomRule(settings, "ngCommand")
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
        hasTagRule: checkHasTagRule(ngCommands),
    };
}

function getNgCommandSet(ngCommandData: NgCommandData) {
    return new Set(ngCommandData.rules.map((ngCommand) => ngCommand.rule));
}
