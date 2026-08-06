import type { Log } from "@/types/storage/log.types";
import { proxy } from "@/utils/proxy";
import { catchAsync } from "@/utils/util";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface LogState {
  log?: Log | undefined;
  userId?: string;
  isLoading: boolean;
  load: () => void;
}

export const useLogStore = create<LogState>()(
  subscribeWithSelector((set) => ({
    isLoading: true,
    load: catchAsync(async () => {
      const params = new URLSearchParams(location.search);
      const id = params.get("id");
      const userId = params.get("userId");

      const log = id === null ? undefined : await proxy.getLog(id);

      set({
        log,
        isLoading: false,
        ...(userId !== null && { userId }),
      });
    }),
  })),
);
