import * as readline from "readline";
import chalk from "chalk";

function ask(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    });
  });
}

async function prompt(query?: string): Promise<void> {
  if (!process.env.SKIP_PROMPTS) {
    if (query) console.log(`${query}\n`);
    const reply = await ask(
      `${chalk.green("Continue?")} Enter (y) Yes / (n) No\n`
    );
    if (reply.toLowerCase() !== "y" && reply.toLowerCase() !== "yes") {
      console.log("Aborted.");
      process.exit(1);
    }
  }
}

export { ask, prompt };
