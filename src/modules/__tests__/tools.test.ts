
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { tools } from "../tools";
import { AllowedRoles } from "../utils/nftData";

jest.mock("../utils/nftData", () => ({
  handleData: jest.fn().mockResolvedValue("mocked data"),
  rolesMap: {
    manager: "manager",
    admin: "admin",
    customer: "customer",
    owner: "owner",
    offer: "offer",
  },
  AllowedRoles: ["manager", "admin", "customer", "owner", "offer"],
}));

describe("tools", () => {
  let server: McpServer;

  beforeEach(() => {
    server = { tool: jest.fn() } as unknown as McpServer;
  });

  it("should return mocked data for valid role", async () => {
    tools.registerTools(server);
    const mockTool = server.tool as jest.MockedFunction<typeof server.tool>;
    const mockCallback = mockTool.mock.calls[0][2] as any;
    const result = await mockCallback({ ruolo: "manager" });
    expect(result.content[0].text).toBe("mocked data");
  });

  it("should return default message for invalid role", async () => {
    tools.registerTools(server);
    const mockTool = server.tool as jest.MockedFunction<typeof server.tool>;
    const mockCallback = mockTool.mock.calls[0][2] as any;
    const result = await mockCallback({ ruolo: "invalid" });
    expect(result.content[0].text).toBe("Please specify a valid role (proprietario / admin / manager / customer .");
  });
});
