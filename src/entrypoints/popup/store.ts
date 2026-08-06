import type { Log } from "@/types/storage/log.types";
import { getActiveTab } from "@/utils/browser";
import { getLogIdViaMessage } from "@/utils/messaging";
import { proxy } from "@/utils/proxy";
import { catchAsync, isWatchPage } from "@/utils/util";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface PopupState {
  log?: Log | undefined;
  logId?: string | undefined;
  isWatchPage: boolean;
  isLoading: boolean;
  load: () => void;
}

export const usePopupStore = create<PopupState>()(
  subscribeWithSelector((set) => ({
    isWatchPage: false,
    isLoading: true,
    load: catchAsync(async () => {
      const logId = await getLogIdViaMessage();
      const log = logId === undefined ? undefined : await proxy.getLog(logId);

      const tab = await getActiveTab();

      set({
        log,
        logId,
        isWatchPage: isWatchPage(tab?.url),
        isLoading: false,
      });
    }),
  })),
);
