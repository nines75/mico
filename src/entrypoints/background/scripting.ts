import { commentSchema } from "@/types/api/comment.types";
import { getActiveTab } from "@/utils/browser";

type Fiber = Record<
  string,
  {
    child?: {
      memoizedProps?: {
        comment?: unknown;
      };
    };
  }
>;

export async function getMenuComment() {
  const tab = await getActiveTab();
  const tabId = tab?.id;
  if (tabId === undefined) return;

  const results = await browser.scripting.executeScript({
    target: { tabId },
    world: "MAIN", // reactFiberプロパティにアクセスするためにMAINで実行
    func: () => {
      const menu = document.querySelector(".z_dropdown");
      if (menu === null) return;

      for (const [key, value] of Object.entries(menu as unknown as Fiber)) {
        if (!key.startsWith("__reactFiber$")) continue;

        // ここはcontent scriptとして実行されるため、バリデーションは外で行う必要がある
        // また、structured-clonableな値しか送れないが上位のプロパティにはそうでない値が含まれているためcommentまで辿る
        return value.child?.memoizedProps?.comment;
      }
    },
  });

  return commentSchema.safeParse(results[0]?.result).data;
}
