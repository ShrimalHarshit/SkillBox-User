/**
 * SkillBox AI — repository entry point.
 * The consumer application lives fully self-contained in `src/consumer/`
 * so the rest of the project (research / backend tooling) stays untouched.
 */
import ConsumerApp from "./consumer/App";

export default function App() {
  return <ConsumerApp />;
}
