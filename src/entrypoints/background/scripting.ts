import { commentSchema } from "@/types/api/comment-api.types";

type Fiber = Record<
    string,
    {
        child?: {
            memoizedProps?: {
                // browser.scripting.ScriptInjection.funcの戻り値の型定義がvoid|undefinedなのでunknownは使えない
                comment?: never;
            };
        };
    }
>;

export async function getDropdownComment(
    sender: browser.runtime.MessageSender,
) {
    const tabId = sender.tab?.id;
    if (tabId === undefined) return;

    const results = await browser.scripting.executeScript({
        target: { tabId },
        world: "MAIN", // reactFiberプロパティにアクセスするためにMAINで実行
        func: () => {
            const dropdown = document.querySelector(".z_dropdown");
            if (dropdown === null) return;

            for (const [key, value] of Object.entries(
                dropdown as unknown as Fiber,
            )) {
                if (!key.startsWith("__reactFiber$")) continue;

                // ここはcontent scriptとして実行されるため、バリデーションは外で行う必要がある
                // また、structured-clonableな値しか送れないが上位のプロパティにはそうでない値が含まれているためcommentまで辿る
                return value.child?.memoizedProps?.comment;
            }
        },
    });

    return commentSchema.safeParse(results[0]?.result).data;
}
