import type { Settings } from "../types/storage/settings.types";

export const defaultSettings: Settings = {
  // -------------------------------------------------------------------------------------------
  // 一般設定
  // -------------------------------------------------------------------------------------------

  // エディター
  enableCloseBrackets: true,
  enableHighlightTrailingWhitespace: true,

  // 通知
  notifyOnManualNg: true,
  notifyOnAutoNg: true,

  // 高度な機能
  showAdvancedFeatures: false,
  importLocalFilterOnLoad: false,
  importOnlyWhenWslRunning: false,
  localFilterPath: "",

  // -------------------------------------------------------------------------------------------
  // フィルター
  // -------------------------------------------------------------------------------------------

  selectedFilter: "manual",
  manualFilter: `# フィルター構文の詳細: https://github.com/nines75/mico/wiki/フィルター構文

#============================================================

@comment-user-id

# ここに非表示にしたいコメントのユーザーIDを入力

@end

#============================================================

@comment-commands

# ここに非表示にしたいコメントのコマンドを入力

@end

#============================================================

@comment-body

# ここに非表示にしたいコメントの本文を入力

@end

#============================================================

@video-id

# ここに非表示にしたい動画のIDを入力

@end

#============================================================

@video-owner-id

# ここに非表示にしたい動画の投稿者IDを入力

@end

#============================================================

@video-owner-name

# ここに非表示にしたい動画の投稿者名を入力

@end

#============================================================

@video-title

# ここに非表示にしたい動画のタイトルを入力

@end
`,
  autoFilter: [],

  // -------------------------------------------------------------------------------------------
  // コメントフィルター
  // -------------------------------------------------------------------------------------------

  enableCommentFilter: true,

  // フィルタリング
  enableEasyCommentFilter: false,
  enableCommentAssistFilter: false,
  enableScoreFilter: false,
  scoreFilterThreshold: -4800,
  ignoreMyComments: true,
  ignoreByNicoru: false,
  ignoreByNicoruThreshold: 30,

  // ドロップダウン
  showUserIdInDropdown: false,
  showScoreInDropdown: false,
  autoReload: false,

  // -------------------------------------------------------------------------------------------
  // 動画フィルター
  // -------------------------------------------------------------------------------------------

  enableVideoFilter: true,

  // フィルタリング
  hideCommentPreview: false,
  enablePaidFilter: false,
  enableViewCountFilter: false,
  viewCountFilterThreshold: 1000,

  // -------------------------------------------------------------------------------------------
  // その他
  // -------------------------------------------------------------------------------------------

  storeId: "",

  // タブ
  selectedSettingsTab: "general",
} as const;
