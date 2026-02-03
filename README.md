# KrezBooks

## Import starších dat (legacy import)

Pro import starších dat ze systému je nutné dodržet následující pravidla:

### Pojmenování souborů

Soubory musí být pojmenovány přesně takto:
- `contacts.tsv` - pro kontakty
- `items.tsv` - pro položky

### Kódování souborů

Před importem je nutné převést kódování souborů na **UTF-8**.

Postup v PSPadu:
1. Otevřete soubor v PSPadu
2. Zvolte menu **Formát** → **Překódování ASCII**
3. Vyberte původní kódování (např. Windows-1250 nebo CP852)
4. Uložte soubor jako UTF-8

Alternativně lze použít volbu **Soubor** → **Uložit jako...** a v dialogu změnit kódování na UTF-8.

### Umístění souborů

Oba soubory (`contacts.tsv` a `items.tsv`) umístěte do stejné složky a při importu vyberte tuto složku.
