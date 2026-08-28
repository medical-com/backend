import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import Modules from "@/modules";

import { attachUser } from "@/core/middleware/attach-user";
import { errorHandler } from "@/core/middleware/error-handler";
import { notFoundHandler } from "@/core/middleware/not-found-handler";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(attachUser);

new Modules(app);

app.use(notFoundHandler);
app.use(errorHandler);
