import { test, expect } from "@playwright/test";

async function connectMock(page: import("@playwright/test").Page) {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /connect fiber wallet/i }).click();
  const dialog = page.getByRole("dialog", { name: /connect fiber wallet/i });
  await expect(dialog).toBeVisible();
  // Mock is the default selected provider; click Connect.
  await dialog.getByRole("button", { name: /^connect$/i }).click();
  await expect(
    page.getByRole("button", { name: /connected/i }),
  ).toBeVisible();
}

test("landing page renders and links to the dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: /wallet connect/i }),
  ).toBeVisible();
  await page.getByRole("link", { name: /launch live dashboard/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(
    page.getByRole("heading", { name: /fiberx dashboard/i }),
  ).toBeVisible();
});

test("connects to the mock wallet", async ({ page }) => {
  await connectMock(page);
  await expect(page.getByTestId("node-info")).toContainText("Demo Fiber Wallet");
  await expect(page.getByTestId("node-info")).toContainText("mock");
});

test("happy path: create invoice, check readiness, pay", async ({ page }) => {
  await connectMock(page);

  // Create an invoice for 1 CKB.
  await page.getByTestId("invoice-amount").fill("1");
  await page.getByTestId("invoice-currency").selectOption("CKB");
  await page.getByTestId("create-invoice").click();

  const output = page.getByTestId("invoice-output");
  await expect(output).toBeVisible();
  await expect(output).toContainText("fibt_mock_");

  // Check readiness (prefilled from last invoice).
  await page.getByTestId("check-can-pay").click();
  await expect(page.getByTestId("readiness-output")).toContainText("READY");

  // Pay.
  await page.getByTestId("pay-invoice").click();
  const payDialog = page.getByRole("dialog", { name: /fiber payment/i });
  await expect(payDialog).toBeVisible();
  await expect(payDialog.getByText(/payment succeeded/i)).toBeVisible({
    timeout: 15_000,
  });
});

test("failure path: oversized payment is not ready", async ({ page }) => {
  await connectMock(page);

  await page.getByTestId("invoice-amount").fill("999999");
  await page.getByTestId("invoice-currency").selectOption("CKB");
  await page.getByTestId("create-invoice").click();
  await expect(page.getByTestId("invoice-output")).toContainText("fibt_mock_");

  await page.getByTestId("check-can-pay").click();
  await expect(page.getByTestId("readiness-output")).toContainText(
    "INSUFFICIENT_OUTBOUND_CAPACITY",
  );
  await expect(page.getByTestId("readiness-output")).toContainText(
    /smaller amount/i,
  );
});
