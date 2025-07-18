# コメントフィルター

## フィルター構文

### コメント

`#`以降の文字列はコメントと解釈されます。  
`#`の前が1個以上の空白文字だった場合、それはルールとは解釈されません。

### エスケープ

構文として解釈される文字列の前にバックスラッシュ(`\`)を付けることでエスケープできます。

`\`はルールを抽出する際に削除されます。  
ただし、行頭にある`\`はそれがエスケープ用として使われているかに関わらず削除されます。  
これは構文指令(`@end`,`@strict`)が利用可能なフィルターでのみ行われます

#### 例

```
# コメント記号
example\#rule # 'example#rule'というルールとして解釈

# NGコマンド(構文指令が利用可)
\@end # '@end'というルールとして解釈
\\@end # '\@end'というルールとして解釈
\cmd # 'cmd'というルールとして解釈(構文指令でなくても行頭のエスケープ記号は削除される)

# NGユーザーID(構文指令が利用不可)
\userId # '\userId'というルールとして解釈(行頭のエスケープ記号が削除されない)
```

### ルールの終了(`@end`)

`@end`と書くことで、直近に書いた`@`で始まるルールの適用を終了させます。  
書かなかった場合は宣言した場所から終端までが適用範囲になります。

#### 例

```
@strict
rule1 # strictルール
@end

rule2 # 特殊ルールなし

@strict
rule3 # strictルール
```

### strictルール(`@strict`/`!`)

strictルールとは、フィルタリングされたコメントの投稿者のユーザーIDを自動でフィルターの先頭に追加するルールです。

このルールによってフィルタリングされたユーザーIDにはログで`[!]`という記号が表示されます。

フィルターは基本的に昇順に評価されますが、strictルールはかんたんコメントの一括非表示を除いた全てのフィルターに先行して評価されます。  
これはルールを書いた順番によってフィルタリング結果が変わらないようにするためです。

#### `@strict`

`@strict`と書くことで、以降のフィルタリングルールをstrictルールにします。

#### `!`

行頭に`!`を付けることで一行だけstrictルールにすることができます。

#### 例

```
@strict
rule1 # strictルール
@end

!rule2 # strictルール
```

### tagルール(`@include`/`@exclude`)

tagルールとは、動画タグに基づいてフィルタリングルールの適用/除外ができるルールです。

#### `@include`

指定したパターンにマッチする動画タグがある場合、以降のフィルタリングルールを**有効化**します。

#### `@exclude`

指定したパターンにマッチする動画タグがある場合、以降のフィルタリングルールを**無効化**します。

#### パターンの指定方法

`@include`または`@exclude`のあとに、**半角スペース**1個以上で区切って何回でも指定できます。  
複数個指定した場合、OR条件として判定されます(いずれかのパターンに1つでも一致したら適用/除外)。

> [!WARNING]
> 全角スペースは文字と解釈されるため注意してください。

パターンは大小文字を区別しない**正規表現**として処理されます。  
よって、単に`tag`と記述するだけでは`tagA`や`tagB`にもマッチするため、完全一致にしたい場合は`^tag$`と記述する必要があります。

この記法はネストさせることができます。  
その際、`@include`と`@exclude`が競合した場合は`@exclude`が優先されます。

#### 例

```
@include ^tag1$ ^tag2$
rule1 # tag1,tag2のいずれかが動画タグに存在した場合に有効化

@include ^tag3$
rule2 # tag1,tag2,tag3のいずれかが動画タグに存在した場合に有効化
@end

@exclude ^tag4$
rule3 # tag1,tag2のいずれかが動画タグに存在した場合に有効化。ただしtag4が存在した場合tag1,tag2のいずれかが存在しても無効化
@end

@end
```

### 無効化ルール(`@disable`)

無効化ルールとは、コメントのコマンドを無効化できるルールです。

コマンドの無効化時点ではコメントはフィルタリングログに追加されません。

ポップアップに無効化したコマンドの数が表示されますが、これは無効化後に非表示されたコメントのコマンドの数も含まれます。

NGコマンド内ではstrictルールも使用可能ですが、無効化ルールと重複した場合はstrictルールは適用されません。

#### `@disable`

`@disable`と書くことで、以降のフィルタリングルールを無効化ルールにします。

#### `all`

無効化ルールとして`all`と書くと、全てのコマンドを無効化します。  
単なるNGコマンドとして登録しても効果はありません。

#### 例

```
@disable
red # 'red'というコマンドを無効化
all # すべてのコマンドを無効化
@end

all # 'all'というコマンドを無効化
```

### 動画限定ルール

動画限定ルールとは、特定の動画IDのみ適用されるルールです。

`動画ID@ユーザーID`という形式で動画IDを指定します。  
基本的にはコメントをクリックした際に出るドロップダウンから自動で追加することを想定していますが、手動でも指定できます。

#### 例

```
sm1234@example-user-id # 動画IDがsm1234である場合のみ、example-user-idというユーザーIDをフィルタリング
```

### 各フィルターで使用できる構文

|                       | NGユーザーID |    NGコマンド    | NGワード |
| :-------------------: | :----------: | :--------------: | :------: |
|       正規表現        | ❌(完全一致) | ❌(小文字に変換) |    ✅    |
|     コメント(`#`)     |      ✅      |        ✅        |    ✅    |
|        `@end`         |      ❌      |        ✅        |    ✅    |
|     `@strict`/`!`     |      ❌      |        ✅        |    ✅    |
| `@include`/`@exclude` |      ❌      |        ✅        |    ✅    |
|      `@disable`       |      ❌      |        ✅        |    ❌    |
|    動画限定ルール     |      ✅      |        ❌        |    ❌    |

## ログ

### 各種ログに表示できるもの

|                      | NGユーザーID |   NGスコア   | NGコマンド | NGワード |
| :------------------: | :----------: | :----------: | :--------: | :------: |
|       NGスコア       |      ✅      | ✅(常に表示) |     ✅     |    ❌    |
|        ニコる        |      ✅      |      ✅      |     ✅     |    ❌    |
| 重複したコメントの数 |      ❌      |      ❌      |     ❌     |    ✅    |
