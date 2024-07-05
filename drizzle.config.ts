import { defineConfig } from "drizzle-kit"

export default defineConfig({
	schema: "./src/db/schema/*",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL!,
	},
	out: "./src/db/migrations",
	verbose: true,
	strict: true,
})
