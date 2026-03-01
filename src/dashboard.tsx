import { render } from "ink";
import { App } from "./components/App.tsx";

process.stdout.write("\x1Bc");
render(<App />);
