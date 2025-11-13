import { StockMovementService } from "./StockMovementService";

export class StockCalculationService {
	private stockMovementService: StockMovementService;

	constructor() {
		this.stockMovementService = new StockMovementService();
	}

	async calculateResetPoint(
		itemEan: string,
		newMovementAmount: number,
	): Promise<boolean> {
		const currentStock =
			await this.stockMovementService.getStockAmountByItem(itemEan);
		const resultingStock = currentStock + newMovementAmount;

		// Return true if we're crossing from positive to zero or negative
		return currentStock > 0 && resultingStock <= 0;
	}
}
