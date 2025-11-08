import { BrowserWindow, ipcMain } from "electron";
import { getDatabase } from "./database";
import { handleIpcRequest } from "./ipcWrapper";
import type {
	Contact,
	Item,
	CreateContactInput,
	CreateItemInput,
	CreateStockMovementInput,
	StockMovement,
	CreateInvoiceInput,
	Invoice,
} from "../types/database";
import { logger } from "./logger";
import {
	contactService,
	invoiceService,
	itemService,
	stockMovementService,
} from "../service";

// ============================================================================
// IPC HANDLER REGISTRATION
// ============================================================================

export function registerIpcHandlers() {
	// --------------------------------------------------------------------------
	// DATABASE TEST
	// --------------------------------------------------------------------------

	ipcMain.handle("db:test", async () => {
		return handleIpcRequest(async () => {
			const db = getDatabase();
			const result = db.prepare("SELECT 1 as test").get();
			return result;
		});
	});

	// --------------------------------------------------------------------------
	// CONTACTS HANDLERS
	// --------------------------------------------------------------------------

	ipcMain.handle("db:contacts:getAll", async () => {
		return handleIpcRequest(() => contactService.getAll());
	});

	ipcMain.handle(
		"db:contacts:getOne",
		async (_event, ico: string, modifier: number) => {
			return handleIpcRequest(() => contactService.getOne(ico, modifier));
		},
	);

	ipcMain.handle(
		"db:contacts:create",
		async (_event, contact: CreateContactInput) => {
			return handleIpcRequest(() => contactService.create(contact));
		},
	);

	ipcMain.handle(
		"db:contacts:update",
		async (
			_event,
			ico: string,
			modifier: number,
			updates: Partial<Contact>,
		) => {
			return handleIpcRequest(() =>
				contactService.update(ico, modifier, updates),
			);
		},
	);

	ipcMain.handle(
		"db:contacts:delete",
		async (_event, ico: string, modifier: number) => {
			return handleIpcRequest(() => contactService.delete(ico, modifier));
		},
	);

	// --------------------------------------------------------------------------
	// ITEMS HANDLERS
	// --------------------------------------------------------------------------

	ipcMain.handle("db:items:getAll", async () => {
		return handleIpcRequest(() => itemService.getAll());
	});

	ipcMain.handle("db:items:getOne", async (_event, ean: string) => {
		return handleIpcRequest(() => itemService.getOne(ean));
	});

	ipcMain.handle("db:items:create", async (_event, item: CreateItemInput) => {
		return handleIpcRequest(() => itemService.create(item));
	});

	ipcMain.handle(
		"db:items:update",
		async (_event, ean: string, updates: Partial<Item>) => {
			return handleIpcRequest(() => itemService.update(ean, updates));
		},
	);

	ipcMain.handle("db:items:delete", async (_event, ean: string) => {
		return handleIpcRequest(() => itemService.delete(ean));
	});

	ipcMain.handle("db:items:getCategories", async () => {
		return handleIpcRequest(() => itemService.getCategories());
	});

	// --------------------------------------------------------------------------
	// STOCK MOVEMENTS HANDLERS
	// --------------------------------------------------------------------------

	ipcMain.handle("db:stockMovements:getAll", async () => {
		return handleIpcRequest(() => stockMovementService.getAll());
	});

	ipcMain.handle(
		"db:stockMovements:getOne",
		async (_event, invoiceNumber: string, itemEan: string) => {
			return handleIpcRequest(() =>
				stockMovementService.getOne(invoiceNumber, itemEan),
			);
		},
	);

	ipcMain.handle(
		"db:stockMovements:getByInvoice",
		async (_event, invoiceNumber: string) => {
			return handleIpcRequest(() =>
				stockMovementService.getByInvoice(invoiceNumber),
			);
		},
	);

	ipcMain.handle(
		"db:stockMovements:create",
		async (_event, movement: CreateStockMovementInput) => {
			return handleIpcRequest(() => stockMovementService.create(movement));
		},
	);

	ipcMain.handle(
		"db:stockMovements:update",
		async (
			_event,
			invoiceNumber: string,
			itemEan: string,
			updates: Partial<StockMovement>,
		) => {
			return handleIpcRequest(() =>
				stockMovementService.update(invoiceNumber, itemEan, updates),
			);
		},
	);

	ipcMain.handle(
		"db:stockMovements:delete",
		async (_event, invoiceNumber: string, itemEan: string) => {
			return handleIpcRequest(() =>
				stockMovementService.delete(invoiceNumber, itemEan),
			);
		},
	);

	ipcMain.handle(
		"db:stockMovements:deleteByInvoice",
		async (_event, invoiceNumber: string) => {
			return handleIpcRequest(() =>
				stockMovementService.deleteByInvoice(invoiceNumber),
			);
		},
	);

	ipcMain.handle(
		"db:stockMovements:getByItem",
		async (_event, itemEan: string) => {
			return handleIpcRequest(() => stockMovementService.getByItem(itemEan));
		},
	);

	ipcMain.handle(
		"db:stockMovements:getStockAmountByItem",
		async (_event, itemEan: string) => {
			return handleIpcRequest(() =>
				stockMovementService.getStockAmountByItem(itemEan),
			);
		},
	);

	ipcMain.handle(
		"db:stockMovements:getAverageBuyPriceByItem",
		async (_event, itemEan: string) => {
			return handleIpcRequest(() =>
				stockMovementService.getAverageBuyPriceByItem(itemEan),
			);
		},
	);

	ipcMain.handle(
		"db:stockMovements:getLastBuyPriceByItem",
		async (_event, itemEan: string) => {
			return handleIpcRequest(() =>
				stockMovementService.getLastBuyPriceByItem(itemEan),
			);
		},
	);

	ipcMain.handle(
		"db:stockMovements:getTotalByItemEanAndInvoiceNumber",
		async (_event, itemEan: string, invoiceNumber: string) => {
			return handleIpcRequest(() =>
				stockMovementService.getTotalbyItemEanAndInvoiceNumber(
					itemEan,
					invoiceNumber,
				),
			);
		},
	)

	ipcMain.handle(
		"db:stockMovements:getTotalByInvoiceNumber",
		async (_event, invoiceNumber: string) => {
			return handleIpcRequest(() =>
				stockMovementService.getTotalByInvoiceNumber(invoiceNumber),
			);
		},
	);

	ipcMain.handle(
		"db:stockMovements:getTotalByInvoiceNumberVat",
		async (_event, invoiceNumber: string) => {
			return handleIpcRequest(() =>
				stockMovementService.getTotalByInvoiceNumberVat(invoiceNumber),
			);
		},
	)

	// --------------------------------------------------------------------------
	// INVOICES HANDLERS
	// --------------------------------------------------------------------------

	ipcMain.handle("db:invoices:getAll", async () => {
		return handleIpcRequest(() => invoiceService.getAll());
	});

	ipcMain.handle("db:invoices:getOne", async (_event, number: string) => {
		return handleIpcRequest(() => invoiceService.getOne(number));
	});

	ipcMain.handle(
		"db:invoices:create",
		async (_event, invoice: CreateInvoiceInput) => {
			return handleIpcRequest(() => invoiceService.create(invoice));
		},
	);

	ipcMain.handle(
		"db:invoices:update",
		async (_event, number: string, updates: Partial<Invoice>) => {
			return handleIpcRequest(() => invoiceService.update(number, updates));
		},
	);

	ipcMain.handle("db:invoices:delete", async (_event, number: string) => {
		return handleIpcRequest(() => invoiceService.delete(number));
	});

	logger.info("✓ IPC handlers registered");
}

// ============================================================================
// WINDOW CONTROL HANDLERS
// ============================================================================

ipcMain.on("window-minimize", (event) => {
	const win = BrowserWindow.fromWebContents(event.sender);
	if (win) win.minimize();
});

ipcMain.on("window-maximize", (event) => {
	const win = BrowserWindow.fromWebContents(event.sender);
	if (win) {
		if (win.isMaximized()) {
			win.unmaximize();
		} else {
			win.maximize();
		}
	}
});

ipcMain.on("window-close", (event) => {
	const win = BrowserWindow.fromWebContents(event.sender);
	if (win) win.close();
});
