#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import prompts from "prompts";
import { createProject } from "./utils/file.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

async function promptForValues(): Promise<{ name: string; directory: string }> {
  const response = await prompts([
    {
      type: "text",
      name: "name",
      message: "What is the name of your MCP server?",
      validate: (value) => (value.length > 0 ? true : "Name is required"),
    },
    {
      type: "text",
      name: "directory",
      message: "Where would you like to create it?",
      initial: ".",
    },
  ]);

  // If the user cancels the prompt (Ctrl+C), exit gracefully
  if (!response.name || !response.directory) {
    console.log(chalk.yellow("\nOperation cancelled"));
    process.exit(0);
  }

  return response;
}

async function createMcpServer(name: string, directory: string) {
  const targetDir = path.resolve(directory, name);

  try {
    console.log(chalk.blue(`Creating new MCP server: ${name}`));

    // Check if directory exists
    if (await fs.pathExists(targetDir)) {
      console.error(chalk.red(`Directory ${targetDir} already exists!`));
      process.exit(1);
    }

    // Create project
    await createProject(name, targetDir);

    console.log(chalk.green("\nMCP server created successfully! 🎉"));
    console.log(chalk.yellow("\nNext steps:"));
    console.log(chalk.white(`  1. cd ${name}`));
    console.log(chalk.white("  2. yarn install"));
    console.log(chalk.white("  3. yarn dev"));
  } catch (error) {
    console.error(chalk.red("Error creating project:"), error);
    process.exit(1);
  }
}

program
  .name("create-mcp-server")
  .description("CLI tool to create new MCP server projects")
  .version("1.0.0")
  .argument("[name]", "Name of the MCP server")
  .option("-d, --directory <directory>", "Target directory", ".")
  .action(async (name: string | undefined, options: { directory: string }) => {
    if (!name) {
      // No arguments provided, use interactive mode
      const values = await promptForValues();
      await createMcpServer(values.name, values.directory);
    } else {
      // Arguments provided, use them directly
      await createMcpServer(name, options.directory);
    }
  });

program.parse();
