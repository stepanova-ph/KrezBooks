import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	useRef,
	useEffect,
} from "react";

interface TableControlsContextValue<T> {
	// Selection state
	focusedKey: string | number | null;
	focusedIndex: number;
	focusedItem: T | null;

	// Actions
	setFocusedKey: (key: string | number | null) => void;
	setFocusedIndex: (index: number) => void;
	moveUp: () => void;
	moveDown: () => void;
	movePageUp: () => void;
	movePageDown: () => void;
	moveToTop: () => void;
	moveToBottom: () => void;
	enter: () => void;

	// Data management
	setData: (data: T[], getKey: (item: T) => string | number) => void;

	// Callbacks
	setOnEnterPress: (callback: (() => void) | undefined) => void;
}

const TableControlsContext =
	createContext<TableControlsContextValue<any> | null>(null);

interface TableControlsProviderProps<T> {
	children: React.ReactNode;
	disabled?: boolean;
}

export function TableControlsProvider<T>({
	children,
	disabled = false,
}: TableControlsProviderProps<T>) {
	const [focusedIndex, setFocusedIndexState] = useState(0);
	const [focusedKey, setFocusedKey] = useState<string | number | null>(null);
	const [focusedItem, setFocusedItem] = useState<T | null>(null);

	// USE REF TO AVOID RE-RENDER LOOP
	const onEnterPressRef = useRef<(() => void) | undefined>(undefined);

	const dataRef = useRef<T[]>([]);
	const getKeyRef = useRef<(item: T) => string | number>(
		(item: any) => item.id,
	);

	// Update focused item when index changes
	useEffect(() => {
		const item = dataRef.current[focusedIndex];
		if (item) {
			const key = getKeyRef.current(item);
			setFocusedKey(key);
			setFocusedItem(item);
		} else {
			setFocusedKey(null);
			setFocusedItem(null);
		}
	}, [focusedIndex]);

	const setFocusedIndex = useCallback((index: number) => {
		const maxIndex = Math.max(0, dataRef.current.length - 1);
		const clampedIndex = Math.max(0, Math.min(index, maxIndex));
		setFocusedIndexState(clampedIndex);
	}, []);

	const moveUp = useCallback(() => {
		if (disabled) return;
		setFocusedIndex(focusedIndex - 1);
	}, [disabled, focusedIndex, setFocusedIndex]);

	const moveDown = useCallback(() => {
		if (disabled) return;
		setFocusedIndex(focusedIndex + 1);
	}, [disabled, focusedIndex, setFocusedIndex]);

	const movePageUp = useCallback(() => {
		if (disabled) return;
		setFocusedIndex(focusedIndex - 10);
	}, [disabled, focusedIndex, setFocusedIndex]);

	const movePageDown = useCallback(() => {
		if (disabled) return;
		setFocusedIndex(focusedIndex + 10);
	}, [disabled, focusedIndex, setFocusedIndex]);

	const moveToTop = useCallback(() => {
		if (disabled) return;
		setFocusedIndex(0);
	}, [disabled, setFocusedIndex]);

	const moveToBottom = useCallback(() => {
		if (disabled) return;
		setFocusedIndex(dataRef.current.length - 1);
	}, [disabled, setFocusedIndex]);

	const enter = useCallback(() => {
		if (disabled) return;
		onEnterPressRef.current?.();
	}, [disabled]);

	const setData = useCallback(
		(data: T[], getKey: (item: T) => string | number) => {
			dataRef.current = data;
			getKeyRef.current = getKey;

			// Reset focus if current index is out of bounds
			if (focusedIndex >= data.length && data.length > 0) {
				setFocusedIndex(data.length - 1);
			} else if (data.length === 0) {
				setFocusedIndex(0);
			}
		},
		[focusedIndex, setFocusedIndex],
	);

	// USE CALLBACK THAT UPDATES REF, NOT STATE
	const setOnEnterPress = useCallback((callback: (() => void) | undefined) => {
		onEnterPressRef.current = callback;
	}, []);

	const value: TableControlsContextValue<T> = {
		focusedKey,
		focusedIndex,
		focusedItem,
		setFocusedKey,
		setFocusedIndex,
		moveUp,
		moveDown,
		movePageUp,
		movePageDown,
		moveToTop,
		moveToBottom,
		enter,
		setData,
		setOnEnterPress,
	};

	return (
		<TableControlsContext.Provider value={value}>
			{children}
		</TableControlsContext.Provider>
	);
}

export function useTableControls<T>(): TableControlsContextValue<T> {
	const context = useContext(TableControlsContext);
	if (!context) {
		throw new Error(
			"useTableControls must be used within TableControlsProvider",
		);
	}
	return context;
}