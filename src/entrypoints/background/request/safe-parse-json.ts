// -------------------------------------------------------------------------------------------
// safeParseJson()はutil.tsで定義していたが、playwrightで使うとエラーが出るためここに隔離
// -------------------------------------------------------------------------------------------

import { z } from "@/utils/zod.js";

export function safeParseJson<T>(
    text: string | null | undefined,
    schema: z.ZodType<T>,
): T | undefined {
    try {
        if (text === null || text === undefined) return;

        const data = JSON.parse(text) as string;
        const result = schema.safeParse(data);

        return result.success ? result.data : undefined;
    } catch {
        return;
    }
}
