import * as Sentry from "@sentry/nextjs";
import { initSentry } from "./src/lib/sentry";

// Reuse the centralized initialization logic
initSentry();
