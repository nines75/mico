# mico

ニコニコ動画にいくつかの便利な機能を追加するFirefox用の拡張機能

[![インストールページへのリンク](src/assets/amo-button.png)](https://addons.mozilla.org/addon/mico)

## 機能

各フィルターごとのログがポップアップから確認できます

### コメントフィルター

無制限にルールを追加できるほか、いくつかのフィルタリング機能が利用できます

- 正規表現のサポート
- かんたんコメントの非表示
- コマンドの無効化
- 動画タグに応じてルールを適用/除外
- コメントの投稿ユーザーを自動でNG登録

フィルター構文の詳細は[こちら](docs/usage.md#フィルター構文)を参照してください

### 動画フィルター

ページに表示される動画へのリンクを非表示にすることができます

対応状況は[こちら](docs/usage.md#対応状況)を参照してください

### 拡張ニコる

ニコるの数に応じてコメントの装飾を変えることができます

基準となるニコるの数は変更することができます

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

[nicoExpansion](https://addons.mozilla.org/addon/nicoexpansion/): 拡張ニコるのアイデアを参考にさせていただきました
