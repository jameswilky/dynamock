import { dynamockClient } from "../src/client/dynamockClient";
import { Locator, Proxy } from "../src/interface";
import { test, expect, it, describe } from "vitest";
import fetch from "node-fetch";
import exp from "constants";

const host = "http://localhost:4000";
const headerIdKey = "Authorization";

describe("Happy paths", () => {
  it("Should intercept post request with an auth token and return proxy values", async () => {
    // Arrange
    const client = dynamockClient({
      host,
      idHeader: { key: headerIdKey, value: (id) => `Bearer ${id}` },
    });

    client.intercept(
      { url: "/login", method: "GET" },
      { body: { token: "12345" }, status: 200 }
    );

    const locator: Locator = { url: "/friends", method: "GET" };
    const proxy = {
      body: {
        users: ["john", "jane"],
      },
      status: 200,
    };

    client.intercept(locator, proxy);

    // Act
    const login = await fetch(`${host}/login`, { method: "GET" });
    expect(login.status).toBe(200);
    const token = await login.json();
    const res = await fetch(`${host}${locator.url}`, {
      method: locator.method,
      headers: { [headerIdKey]: `Bearer ${token}` },
    });

    // Assert
    expect(res.status).toBe(proxy.status);
    const body = await res.json();
    expect(body).toMatchObject(proxy.body);
    expect(res.headers.get(headerIdKey)).toBe("12345");
  });
});
