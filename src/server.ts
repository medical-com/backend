import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import Modules from "@/modules";

import { createServer } from "http";

import { attachUser } from "@/core/middleware/attach-user";
import { errorHandler } from "@/core/middleware/error-handler";
import { notFoundHandler } from "@/core/middleware/not-found-handler";
import { createSocketServer } from "@/core/socket";
import { socketManager } from "@/core/socket/socket-manager";
import { setupBullBoard } from "@/core/mq/bull-board";

const app = express();

app.use(helmet());

setupBullBoard(app);

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(attachUser);

export const server = createServer(app);
const io = createSocketServer(server);
socketManager.initialize(io);

new Modules(app);

app.use(notFoundHandler);
app.use(errorHandler);
