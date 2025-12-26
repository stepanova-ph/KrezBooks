# Assets - Loga a ikony

## Struktura souborů:

```
assets/
├── krezbo_logo.svg       ← Logo FIRMY (používá se na fakturách)
├── krezbooks_logo.png    ← Logo APLIKACE (používá se v appbaru)
├── krezbooks_icon.svg    ← Ikonka APLIKACE (používá se jako app icon)
└── README.md             ← Tento soubor

public/
└── krezbooks_logo.png    ← Kopie loga aplikace pro renderer
```

## Popis souborů:

### 1. `krezbo_logo.svg` - Logo firmy
- **Použití**: Na fakturách vlevo nahoře vedle názvu firmy
- **Formát**: SVG (vektorový)
- **Zobrazená výška**: 40pt (~53px při tisku)
- **Poznámka**: Pokud soubor neexistuje, zobrazí se pouze název firmy

### 2. `krezbooks_logo.png` - Logo aplikace
- **Použití**: V appbaru aplikace (horní lišta)
- **Formát**: PNG
- **Umístění**: Kopie v `public/` pro Vite renderer
- **Zobrazená výška**: 28px v appbaru

### 3. `krezbooks_icon.svg` - Ikonka aplikace
- **Použití**: Ikona aplikace (taskbar, desktop, atd.)
- **Formát**: SVG

## Požadavky na logo firmy (faktury):

- **Formát**: SVG nebo PNG (s průhledným pozadím)
- **Doporučená velikost**: Výška 80-120px, automatická šířka
- **Kvalita**: Min. 300 DPI pro tisk (pokud PNG)
- **Pozice**: Vlevo nahoře vedle názvu firmy KREZBO
