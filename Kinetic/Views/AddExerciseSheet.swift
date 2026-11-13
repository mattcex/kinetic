import SwiftUI

struct AddExerciseSheet: View {
    @EnvironmentObject private var store: Store
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var group: MuscleGroup = .chest
    @FocusState private var nameFocused: Bool

    private struct Suggestion: Identifiable {
        let name: String
        let group: MuscleGroup
        var id: String { name }
    }

    private static let suggestions: [Suggestion] = [
        Suggestion(name: "Wyciskanie leżąc", group: .chest),
        Suggestion(name: "Przysiad", group: .legs),
        Suggestion(name: "Martwy ciąg", group: .back),
        Suggestion(name: "Wyciskanie nad głowę", group: .shoulders),
        Suggestion(name: "Wiosłowanie sztangą", group: .back),
        Suggestion(name: "Podciąganie", group: .back),
        Suggestion(name: "Hip thrust", group: .legs),
        Suggestion(name: "Wyciskanie hantli skos", group: .chest),
        Suggestion(name: "Uginanie ze sztangą", group: .arms),
        Suggestion(name: "Pompki na poręczach", group: .arms),
        Suggestion(name: "Wykroki", group: .legs),
        Suggestion(name: "Unoszenie nóg w zwisie", group: .core)
    ]

    private var trimmedName: String {
        name.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var availableSuggestions: [Suggestion] {
        let existing = Set(store.exercises.map { $0.name.lowercased() })
        return Self.suggestions.filter { !existing.contains($0.name.lowercased()) }
    }

    var body: some View {
        ZStack {
            AmbientBackground(intensity: 0.7)

            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    VStack(alignment: .leading, spacing: 6) {
                        Eyebrow("Nowe ćwiczenie", color: Theme.accent)
                        Text("Co dziś podnosisz?")
                            .font(.system(size: 26, weight: .semibold))
                            .foregroundStyle(Color.white)
                    }
                    .padding(.top, 28)

                    TextField("", text: $name, prompt: Text("Nazwa ćwiczenia").foregroundStyle(Theme.textTertiary))
                        .font(.system(size: 20, weight: .medium))
                        .foregroundStyle(Color.white)
                        .focused($nameFocused)
                        .submitLabel(.done)
                        .onSubmit(create)
                        .glassCard(padding: 18, cornerRadius: 20)

                    VStack(alignment: .leading, spacing: 10) {
                        Eyebrow("Partia")
                        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 4), spacing: 8) {
                            ForEach(MuscleGroup.allCases) { option in
                                groupChip(option)
                            }
                        }
                    }

                    if !availableSuggestions.isEmpty {
                        VStack(alignment: .leading, spacing: 10) {
                            Eyebrow("Popularne")
                            LazyVGrid(columns: [GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8)], spacing: 8) {
                                ForEach(availableSuggestions) { suggestion in
                                    Button {
                                        withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                                            name = suggestion.name
                                            group = suggestion.group
                                        }
                                    } label: {
                                        HStack(spacing: 8) {
                                            Image(systemName: suggestion.group.symbol)
                                                .font(.system(size: 12, weight: .semibold))
                                                .foregroundStyle(Theme.accent)
                                            Text(suggestion.name)
                                                .font(.system(size: 13, weight: .medium))
                                                .foregroundStyle(Color.white)
                                                .lineLimit(1)
                                                .minimumScaleFactor(0.8)
                                            Spacer(minLength: 0)
                                        }
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 11)
                                        .background(
                                            RoundedRectangle(cornerRadius: 14, style: .continuous)
                                                .fill(Color.white.opacity(name == suggestion.name ? 0.12 : 0.05))
                                        )
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 14, style: .continuous)
                                                .strokeBorder(name == suggestion.name ? Theme.accent.opacity(0.6) : Color.white.opacity(0.08), lineWidth: 1)
                                        )
                                    }
                                    .buttonStyle(PressableStyle())
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 20)
            }
            .scrollIndicators(.hidden)
            .scrollDismissesKeyboard(.interactively)
            .safeAreaInset(edge: .bottom) {
                GlowButton(title: "Dodaj ćwiczenie", symbol: "plus", action: create)
                    .disabled(trimmedName.isEmpty)
                    .opacity(trimmedName.isEmpty ? 0.4 : 1)
                    .padding(.horizontal, 20)
                    .padding(.bottom, 8)
            }
        }
        .presentationDragIndicator(.visible)
        .presentationBackground(Color.black)
        .presentationCornerRadius(32)
        .sensoryFeedback(.selection, trigger: group)
    }

    private func groupChip(_ option: MuscleGroup) -> some View {
        let isOn = option == group
        return Button {
            withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                group = option
            }
        } label: {
            VStack(spacing: 6) {
                Image(systemName: option.symbol)
                    .font(.system(size: 16, weight: .semibold))
                Text(option.label)
                    .font(.system(size: 11, weight: .semibold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            .foregroundStyle(isOn ? Color.black : Theme.textSecondary)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(isOn ? AnyShapeStyle(Theme.accentGradient) : AnyShapeStyle(Color.white.opacity(0.05)))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .strokeBorder(Color.white.opacity(isOn ? 0 : 0.08), lineWidth: 1)
            )
            .shadow(color: isOn ? Theme.accent.opacity(0.45) : Color.clear, radius: 10)
        }
        .buttonStyle(PressableStyle())
    }

    private func create() {
        guard !trimmedName.isEmpty else { return }
        store.addExercise(name: trimmedName, group: group)
        dismiss()
    }
}
