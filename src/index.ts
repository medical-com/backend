import { app } from "@/app";
import { config } from "@/core/config";

app.listen(config.port, () => {
	console.warn(`Server listening on port ${config.port}`);
});
