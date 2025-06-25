# mico

ニコニコ動画にいくつかの便利な機能を追加するFirefox用の拡張機能

[![インストールページへのリンク](src/assets/firefox-button.png)](https://addons.mozilla.org/addon/mico)

## 機能

各フィルターごとのログがポップアップから確認できます

### コメントフィルター

無制限にルールを追加できるほか、いくつかの追加のフィルタリング機能が利用できます

- NGワードでの正規表現をサポート
- かんたんコメントの一括非表示
- フィルタリングされたコメントの投稿ユーザーを自動でNG登録
- 一部またはすべてのコマンドを無効化
- 動画タグに応じてフィルタリングルールを適用/除外

詳細なフィルターの構文については[usage.md](docs/usage.md#フィルター構文)を参照してください

### 動画フィルター

ページに表示される動画へのリンクを非表示にすることができます

現在対応しているのは視聴ページの関連動画のみです

### 拡張ニコる

ニコるの数に応じてコメントの装飾を変えることができます

基準となるニコるの数は変更可能です

## Development

### Requirements

- Node.js
- pnpm

### Build

```sh
# Install dependencies
pnpm install

# Build and create a zip file (.output/firefox.xpi)
pnpm zip
```

## クレジット

[nicoExpansion](https://addons.mozilla.org/ja/firefox/addon/nicoexpansion/): 拡張ニコるのアイデアを参考にさせていただきました
