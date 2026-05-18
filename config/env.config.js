"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv = validateEnv;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z
        .enum(['development', 'test', 'production'])
        .default('development'),
    PORT: zod_1.z.coerce.number().int().positive().default(3000),
    DATABASE_URL: zod_1.z.string().url(),
});
function validateEnv(config) {
    const parsed = envSchema.safeParse(config);
    if (!parsed.success) {
        const errors = parsed.error.flatten().fieldErrors;
        throw new Error(`Invalid environment variables:\n${JSON.stringify(errors, null, 2)}`);
    }
    return parsed.data;
}
//# sourceMappingURL=env.config.js.map