import * as z from "zod";

// CSPエラーを抑制
// https://github.com/colinhacks/zod/issues/4461
// eslint-disable-next-line unicorn/no-top-level-side-effects
z.config({ jitless: true });

export * as z from "zod";
