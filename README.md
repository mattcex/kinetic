# Kinetic

Minimalistyczny tracker progresu siłowego na iOS (SwiftUI, iOS 17+).
Czarny, „ambient” wygląd inspirowany aplikacją Ultrahuman, zielone kratki aktywności jak na GitHubie.

## Co potrafi

- Dodawanie ćwiczeń (z podpowiedziami popularnych bojów) i partii mięśniowych
- Zapisywanie serii: ciężar, powtórzenia, serie, data — z wykrywaniem rekordów (szacowane 1RM, wzór Epleya) i animacją „Nowy rekord”
- Ekran główny: wolumen tygodnia z licznikiem, pierścień celu tygodniowego, seria tygodni, treningi, rekordy z 30 dni
- Heatmapa aktywności z 6 miesięcy w stylu GitHub (dotknij dzień, by zobaczyć wolumen)
- Szczegóły ćwiczenia: interaktywny wykres z poświatą (szac. 1RM / ciężar / wolumen; 1M–całość), statystyki, historia z oznaczeniem PR
- Dane demo do wypróbowania i zapis lokalny (JSON w Dokumentach)

## Struktura

```
project.yml            # XcodeGen – projekt Xcode generuje się na CI
Kinetic/App            # punkt wejścia
Kinetic/Model          # modele, Store (zapis), dane demo
Kinetic/Design         # motyw, tło ambient, komponenty
Kinetic/Views          # ekrany, heatmapa, wykres, arkusze
```

## Budowanie bez Maca (ios-builder)

```bash
builder auth github
builder init --project Kinetic --ios-path . --scheme Kinetic
builder ios build          # IPA trafia do ./dist/
```

Na Macu: `brew install xcodegen && xcodegen generate && open Kinetic.xcodeproj`.
