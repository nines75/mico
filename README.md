# mico

ニコニコ動画用のコンテンツブロッカー

[![インストールページへのリンク](src/assets/amo-button.png)](https://addons.mozilla.org/addon/mico)

## 特徴

- 外部と通信しない
- 正規表現をサポート
- フィルタリングログあり

## 機能

フィルター構文の詳細は[こちら](https://github.com/nines75/mico/wiki/フィルター構文)を参照してください

### コメントフィルター

- かんたんコメントを非表示
- コメントアシストによるコメントを非表示
- コマンドを無効化
- 動画情報に応じてルールを有効化・無効化
- コメントの投稿者を自動でNG登録

### 動画フィルター

ページに表示される動画へのリンクを非表示にすることができます  
対応状況は[こちら](https://github.com/nines75/mico/wiki/動画フィルター#対応状況)を参照してください

- コメントプレビューを非表示
- 有料動画を非表示
- 再生回数によるフィルタリング

## サポート

要望・バグ報告は[Issues](https://github.com/nines75/mico/issues)、質問は[Discussions](https://github.com/nines75/mico/discussions)で受け付けています  
また、[メール](mailto:mico.counting258@simplelogin.com)での対応も可能です

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
