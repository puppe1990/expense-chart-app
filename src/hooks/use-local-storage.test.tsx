import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useExpensesStorage } from "./use-local-storage";
import type { Expense } from "@/components/ExpenseForm";

type MockAuthState = {
  user: { id: string; email: string } | null;
  isAuthenticated: boolean;
  loading: boolean;
};

let mockAuthState: MockAuthState = {
  user: { id: "user-1", email: "user@example.com" },
  isAuthenticated: true,
  loading: false,
};

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => mockAuthState,
}));

const createJsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const baseExpense = (id: string, description = "Mercado"): Expense => ({
  id,
  description,
  amount: 120,
  category: "food",
  date: "2026-02-01",
  type: "expense",
  account: "pf",
});

describe("useExpensesStorage sync/version", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    mockAuthState = {
      user: { id: "user-1", email: "user@example.com" },
      isAuthenticated: true,
      loading: false,
    };
  });

  it("loads remote expenses and applies remote version", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        items: [baseExpense("exp-remote")],
        version: 3,
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useExpensesStorage());

    await waitFor(() => expect(result.current.syncState).toBe("idle"));
    expect(result.current.expenses).toHaveLength(1);
    expect(result.current.expenses[0].id).toBe("exp-remote");
    expect(result.current.lastSyncedVersion).toBe(3);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/expenses",
      expect.objectContaining({
        credentials: "include",
      })
    );
  });

  it("uploads local seed when remote is empty and updates version from batch response", async () => {
    localStorage.setItem(
      "expense-chart-expenses-user-1",
      JSON.stringify([baseExpense("exp-local", "Padaria")])
    );

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createJsonResponse({ items: [], version: 0 }))
      .mockResolvedValueOnce(createJsonResponse({ ok: true, version: 7, count: 1 }, 201));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useExpensesStorage());

    await waitFor(() => expect(result.current.lastSyncedVersion).toBe(7));
    expect(result.current.expenses).toHaveLength(1);
    expect(result.current.expenses[0].description).toBe("Padaria");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/expenses",
      expect.objectContaining({ credentials: "include" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/expenses/batch",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      })
    );
  });

  it("keeps optimistic add and updates synced version after mutation response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createJsonResponse({ items: [], version: 2 }))
      .mockResolvedValueOnce(createJsonResponse({ ok: true, version: 4 }, 201));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useExpensesStorage());
    await waitFor(() => expect(result.current.syncState).toBe("idle"));

    await act(async () => {
      result.current.addExpense({
        description: "Ifood",
        amount: 55,
        category: "food",
        date: "2026-02-10",
        type: "expense",
        account: "pf",
      });
    });

    expect(result.current.expenses.some((expense) => expense.description === "Ifood")).toBe(true);
    await waitFor(() => expect(result.current.lastSyncedVersion).toBe(4));
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/expenses",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      })
    );
  });
});
