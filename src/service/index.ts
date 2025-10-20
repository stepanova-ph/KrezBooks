import { ContactService } from "./ContactService";
import { ItemService } from "./ItemService";
import { StockMovementService } from "./StockMovementService";
// import { InvoiceService } from "./InvoiceService";

export const contactService = new ContactService();
export const itemService = new ItemService();
export const stockMovementService = new StockMovementService();
// export const invoiceService = new InvoiceService();