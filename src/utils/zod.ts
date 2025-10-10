import * as z from "zod";

// CSPエラーを抑制
// https://github.com/colinhacks/zod/issues/4461
z.config({ jitless: true });

export { z };
