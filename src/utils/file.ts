import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createProject(name: string, targetDir: string) {
  // Create project directory
  await fs.ensureDir(targetDir);

  // Create project structure
  await fs.ensureDir(path.join(targetDir, "src"));
  await fs.ensureDir(path.join(targetDir, "src/tools"));

  // Create package.json
  await fs.writeJSON(
    path.join(targetDir, "package.json"),
    {
      name,
      version: "1.0.0",
      description: `${name} MCP server`,
      type: "module",
      main: "dist/index.js",
      scripts: {
        build: "tsc",
        start: "node dist/index.js",
        dev: "tsx watch src/index.ts",
      },
      dependencies: {
        "@modelcontextprotocol/sdk": "^1.2.0",
        zod: "^3.22.4",
      },
      devDependencies: {
        "@types/node": "^20.11.24",
        tsx: "^4.19.3",
        typescript: "^5.3.3",
      },
    },
    { spaces: 2 }
  );

  // Create tsconfig.json
  await fs.writeJSON(
    path.join(targetDir, "tsconfig.json"),
    {
      compilerOptions: {
        target: "ES2022",
        module: "Node16",
        moduleResolution: "Node16",
        outDir: "./dist",
        rootDir: "./src",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
      },
      include: ["src/**/*"],
      exclude: ["node_modules"],
    },
    { spaces: 2 }
  );

  // Create main server file
  const mainServerContent = `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { myFirstTool } from "./tools/my-first-tool.js";

const server = new McpServer({
  name: "${name}",
  version: "1.0.0",
});

server.tool(
  "my-first-tool",
  "A simple example tool",
  {},
  async () => {
    const result = myFirstTool();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("${name} MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
`;

  await fs.writeFile(path.join(targetDir, "src/index.ts"), mainServerContent);

  // Create example tool
  const toolContent = `export interface ToolResponse {
  message: string;
  timestamp: number;
}

export const myFirstTool = (): ToolResponse => {
  return {
    message: "Hello from my first MCP tool!",
    timestamp: Date.now(),
  };
};
`;

  await fs.writeFile(
    path.join(targetDir, "src/tools/my-first-tool.ts"),
    toolContent
  );

  // Create README.md
  const readmeContent = `# ${name} MCP Server

This is an MCP (Model Context Protocol) server that provides tools through a standardized interface.

## Getting Started

1. Install dependencies:
   \`\`\`bash
   yarn install
   \`\`\`

2. Start the development server:
   \`\`\`bash
   yarn dev
   \`\`\`

3. Build for production:
   \`\`\`bash
   yarn build
   \`\`\`

4. Start the production server:
   \`\`\`bash
   yarn start
   \`\`\`

## Available Tools

### my-first-tool

A simple example tool that returns a message and timestamp.

## Adding New Tools

1. Create a new file in the \`src/tools\` directory
2. Implement your tool function
3. Add the tool to the server in \`src/index.ts\`

## License

MIT
`;

  await fs.writeFile(path.join(targetDir, "README.md"), readmeContent);
}
