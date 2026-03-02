import { collectAllData } from "./utils/data.ts";
import { render } from "./renderer.ts";

process.stdout.write("\x1Bc");

collectAllData()
  .then((data) => process.stdout.write(render(data).join("\n") + "\n"))
  .catch((err) => { console.error(err); process.exit(1); });
