# mico

ニコニコ動画用のブラウザ拡張機能

[![インストールページへのリンク](src/assets/amo-button.png)](https://addons.mozilla.org/addon/mico)

## 機能

各フィルターのログがポップアップから確認できます

### コメントフィルター

- 正規表現をサポート
- かんたんコメントを非表示
- コマンドを無効化
- 動画タグに応じてルールを適用/除外
- コメントの投稿ユーザーを自動でNG登録

フィルター構文の詳細は[こちら](https://github.com/nines75/mico/wiki/フィルター構文)を参照してください

### 動画フィルター

ページに表示される動画へのリンクを非表示にすることができます

- 正規表現をサポート
- 有料動画を非表示
- コメントプレビューを非表示
- 再生回数によるフィルタリング

対応状況は[こちら](https://github.com/nines75/mico/wiki/動画フィルター#対応状況)を参照してください

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
