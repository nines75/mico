import { parseFilter } from "@/entrypoints/background/parse-filter";
import type { FilterId } from "@/entrypoints/options/components/ui/FilterArea";
import type { Settings } from "@/types/storage/settings.types";
import { defaultSettings } from "./config";
import { isString } from "./util";
import { objectEntries, objectValues } from "ts-extras";
import type { AutoRule, Rule } from "@/entrypoints/background/rule";
import type { Except, ValueOf } from "type-fest";

type FilterTab = "commentFilter" | "videoFilter";
type SettingsTab =
    | "general"
    | "filter"
    | "commentFilter"
    | "videoFilter"
    | "support";

interface SettingsV3 {
    // -------------------------------------------------------------------------------------------
    // 一般設定
    // -------------------------------------------------------------------------------------------

    // エディター
    isCloseBrackets: boolean;
    isHighlightTrailingWhitespace: boolean;

    // 高度な機能
    isAdvancedFeaturesVisible: boolean;
    shouldImportLocalFilterOnLoad: boolean;
    shouldImportOnlyWhenWslRunning: boolean;
    localFilterPath: string;

    // -------------------------------------------------------------------------------------------
    // フィルター
    // -------------------------------------------------------------------------------------------

    selectedFilter: FilterId;

    // -------------------------------------------------------------------------------------------
    // コメントフィルター
    // -------------------------------------------------------------------------------------------

    isCommentFilterEnabled: boolean;

    // フィルタリング
    isEasyCommentHidden: boolean;
    isCommentAssistFilterEnabled: boolean;
    isScoreFilterEnabled: boolean;
    scoreFilterCount: number;
    isMyCommentIgnored: boolean;
    isIgnoreByNicoru: boolean;
    ignoreByNicoruCount: number;
    ngUserId: string;
    ngCommand: string;
    ngWord: string;

    // ログ
    isNgScoreVisible: boolean;
    isNicoruVisible: boolean;
    nicoruVisibleCount: number;
    isDuplicateVisible: boolean;
    duplicateVisibleCount: number;

    // 通知
    isNotifyAddNgUserId: boolean;
    isNotifyAutoAddNgUserId: boolean;

    // ドロップダウン
    isAutoReload: boolean;
    isUserIdMountedToDropdown: boolean;
    isNgScoreMountedToDropdown: boolean;

    // その他
    isCommentNgContextAppended: boolean;

    // -------------------------------------------------------------------------------------------
    // 動画フィルター
    // -------------------------------------------------------------------------------------------

    isVideoFilterEnabled: boolean;

    // フィルタリング
    isPaidVideoHidden: boolean;
    isCommentPreviewHidden: boolean;
    isViewsFilterEnabled: boolean;
    viewsFilterCount: number;
    ngId: string;
    ngUserName: string;
    ngTitle: string;

    // ログ
    isTitleRenderedAsLink: boolean;

    // 通知
    isNotifyAddNgId: boolean;

    // その他
    isNgContextAppendedOnAdd: boolean;

    // -------------------------------------------------------------------------------------------
    // その他
    // -------------------------------------------------------------------------------------------

    // タブ
    selectedSettingsTab: SettingsTab;
    selectedPopupTab: FilterTab;

    // 開閉
    isProcessingTimeOpen: boolean;
    isCountOpen: boolean;
    isLogOpen: boolean;

    // 表示
    isUserIdFilterVisible: boolean;
    isEasyCommentFilterVisible: boolean;
    isCommentAssistFilterVisible: boolean;
    isScoreFilterVisible: boolean;
    isCommandFilterVisible: boolean;
    isWordFilterVisible: boolean;
    isIdFilterVisible: boolean;
    isPaidFilterVisible: boolean;
    isViewsFilterVisible: boolean;
    isUserNameFilterVisible: boolean;
    isTitleFilterVisible: boolean;
}

const keyMap = [
    ["isCloseBrackets", "enableCloseBrackets"],
    ["isHighlightTrailingWhitespace", "enableHighlightTrailingWhitespace"],
    ["isAdvancedFeaturesVisible", "showAdvancedFeatures"],
    ["shouldImportLocalFilterOnLoad", "importLocalFilterOnLoad"],
    ["shouldImportOnlyWhenWslRunning", "importOnlyWhenWslRunning"],
    ["isCommentFilterEnabled", "enableCommentFilter"],
    ["isEasyCommentHidden", "enableEasyCommentFilter"],
    ["isCommentAssistFilterEnabled", "enableCommentAssistFilter"],
    ["isScoreFilterEnabled", "enableScoreFilter"],
    ["scoreFilterCount", "scoreFilterThreshold"],
    ["isMyCommentIgnored", "ignoreMyComments"],
    ["isIgnoreByNicoru", "ignoreByNicoru"],
    ["ignoreByNicoruCount", "ignoreByNicoruThreshold"],
    ["isNotifyAddNgUserId", "notifyOnManualNg"],
    ["isNotifyAutoAddNgUserId", "notifyOnAutoNg"],
    ["isAutoReload", "autoReload"],
    ["isUserIdMountedToDropdown", "showUserIdInDropdown"],
    ["isNgScoreMountedToDropdown", "showScoreInDropdown"],
    ["isVideoFilterEnabled", "enableVideoFilter"],
    ["isPaidVideoHidden", "enablePaidFilter"],
    ["isCommentPreviewHidden", "hideCommentPreview"],
    ["isViewsFilterEnabled", "enableViewCountFilter"],
    ["viewsFilterCount", "viewCountFilterThreshold"],
] satisfies [keyof SettingsV3, keyof Settings][];

export function migrateSettingsToV4(v3: Partial<SettingsV3>) {
    // v3のフィルターでAutoフィルター対象外のものはそのままManualフィルターに結合する
    // Autoフィルター対象の場合は、ルールの中から移行可能なものをAutoフィルターに追加したうえで
    // 元のフィルターから除去し、その後元のフィルターをManualフィルターに結合する

    const autoFilter: Except<AutoRule, "source">[] = [];

    const ngUserIdResult = migrateNgUserId(v3, autoFilter);
    const ngIdResult = migrateNgId(v3, autoFilter);

    const v4: Record<string, ValueOf<Settings>> = {
        autoFilter,
        manualFilter: `# フィルター構文の詳細: https://github.com/nines75/mico/wiki/フィルター構文

#============================================================

@comment-user-id

${ngUserIdResult.filter === "" || !ngUserIdResult.hasManualRule ? "# ここに非表示にしたいコメントのユーザーIDを入力" : ngUserIdResult.filter}

@end

#============================================================

@comment-commands

${v3.ngCommand !== undefined && v3.ngCommand !== "" ? migrateVAlias(v3.ngCommand) : "# ここに非表示にしたいコメントのコマンドを入力"}

@end

#============================================================

@comment-body

${v3.ngWord !== undefined && v3.ngWord !== "" ? migrateVAlias(v3.ngWord) : "# ここに非表示にしたいコメントの本文を入力"}

@end

#============================================================

@video-id

${ngIdResult.filter === "" || !ngIdResult.hasManualRule ? "# ここに非表示にしたい動画のIDを入力" : ngIdResult.filter}

@end

#============================================================

@video-owner-id

${ngIdResult.filter === "" || !ngIdResult.hasManualRule ? "# ここに非表示にしたい動画の投稿者IDを入力" : ngIdResult.filter}

@end

#============================================================

@video-owner-name

${v3.ngUserName !== undefined && v3.ngUserName !== "" ? v3.ngUserName : "# ここに非表示にしたい動画の投稿者名を入力"}

@end

#============================================================

@video-title

${v3.ngTitle !== undefined && v3.ngTitle !== "" ? v3.ngTitle : "# ここに非表示にしたい動画のタイトルを入力"}

@end
`,
    };

    for (const [v3Key, v4Key] of keyMap) {
        const value = v3[v3Key];
        if (value !== undefined) {
            v4[v4Key] = value;
        }
    }

    return { ...v3, ...v4 };
}

function migrateNgUserId(
    v3: Partial<SettingsV3>,
    autoFilter: Except<AutoRule, "source">[],
) {
    const ngUserId = migrateVAlias(v3.ngUserId ?? "");
    const lines = ngUserId.split("\n");
    const rules = parseFilter(
        { ...defaultSettings, manualFilter: ngUserId },
        true,
    ).rules;

    let autoRuleCount = 0;
    for (const rule of rules) {
        // Autoフィルターに移行できるか判定
        if (
            !isString(rule.pattern) ||
            // include.videoIdsは空でなくてもいい
            objectEntries(rule.include).some(([key, value]) => {
                if (key === "videoIds") return false;
                return value.length > 0;
            }) ||
            // excludeはすべて空である必要がある
            objectValues(rule.exclude).some((value) => value.length > 0)
        )
            continue;

        let source: string | undefined;
        let context: string | undefined;

        // eslint-disable-next-line unicorn/consistent-function-scoping
        const extractContext = (line: string | undefined): boolean => {
            if (line === undefined) return false;

            const result = /^# (body|command)\((dropdown|strict)\): (.*)$/.exec(
                line,
            );

            const typeResult = result?.[1]; // body/command
            const sourceResult = result?.[2]; // dropdown/strict
            const contextResult = result?.[3]; // コメント本文/コマンド

            // 抽出に成功したか判定
            if (
                typeResult === undefined ||
                sourceResult === undefined ||
                contextResult === undefined
            )
                return false;

            source = sourceResult;

            switch (typeResult) {
                case "body": {
                    context = `comment-body: ${contextResult}`;
                    break;
                }
                case "command": {
                    context = `comment-commands: ${contextResult}`;
                    break;
                }
            }

            return true;
        };

        const index = rule.index as number;

        const before1 = lines[index - 1];
        const before2 = lines[index - 2];

        const success1 = extractContext(before1);
        const success2 =
            before1?.startsWith("@include-video-ids ") === true && // ここで抽出したいのは自動追加されたコメントなので、末尾は空白文字ではなく半角スペースでいい
            extractContext(before2);

        if (!success1 && !success2 && before1?.startsWith("#") === true)
            context = before1.replace(/^# ?/, "");

        autoFilter.push({
            id: crypto.randomUUID(),
            pattern: rule.pattern,
            target: {
                commentUserId: true,
            },
            ...(source === undefined ? {} : { source }),
            ...(context === undefined ? {} : { context }),
            ...(rule.include.videoIds.length > 0
                ? { include: { videoIds: rule.include.videoIds } }
                : {}),
        });
        lines[index] = "";
        autoRuleCount++;
    }

    return {
        filter: lines.join("\n"),
        hasManualRule: autoRuleCount !== rules.length,
    };
}

function migrateNgId(
    v3: Partial<SettingsV3>,
    autoFilter: Except<AutoRule, "source">[],
) {
    const lines = (v3.ngId ?? "").split("\n");
    const rules = parseFilter(
        { ...defaultSettings, manualFilter: v3.ngId ?? "" },
        true,
    ).rules;

    let autoRuleCount = 0;
    for (const rule of rules) {
        // Autoフィルターに移行できるか判定
        if (!isString(rule.pattern)) continue;

        let target: keyof Rule["target"] | undefined;
        if (/^(?:ch)?\d+$/.test(rule.pattern)) {
            target = "videoOwnerId";
        } else if (/^(?:sm|so|nl|nm)\d+$/.test(rule.pattern)) {
            target = "videoId";
        } else {
            continue;
        }

        let context: string | undefined;
        const index = rule.index as number;
        const before = lines[index - 1];
        if (before?.startsWith("#") === true)
            context = before.replace(/^# ?/, "");

        autoFilter.push({
            id: crypto.randomUUID(),
            pattern: rule.pattern,
            target: {
                [target]: true,
            },
            ...(context === undefined ? {} : { context }),
        });
        lines[index] = "";
        autoRuleCount++;
    }

    return {
        filter: lines.join("\n"),
        hasManualRule: autoRuleCount !== rules.length,
    };
}

function migrateVAlias(filter: string) {
    // @vを見つけたら@include-video-idsに置換し、それ以降の行でルールだと評価できる最も手前の行の次の行に@endを挿入する
    // lines配列を変更するためこの操作を@vを見つけるたびに最初から繰り返し、見つからなくなったら終了

    let result = filter;
    let isFound = true;

    while (isFound) {
        isFound = false;

        const lines = result.split("\n");
        for (const [i, line] of lines.entries()) {
            if (!/^@v\s/.test(line)) continue;

            isFound = true;

            // @v => @include-video-ids
            lines[i] = line.replace(/^@v/, "@include-video-ids");

            // 以降の行でルールとみなせる行を探す
            for (let j = i + 1; j < lines.length; j++) {
                const rule = lines[j];
                if (rule === undefined) continue;

                // 空行/コメント/ディレクティブでない行をルールとみなす
                if (
                    rule !== "" &&
                    !rule.startsWith("#") &&
                    !rule.startsWith("@")
                ) {
                    lines.splice(j + 1, 0, "@end");
                    break;
                }
            }

            break;
        }

        result = lines.join("\n");
    }

    return result;
}
