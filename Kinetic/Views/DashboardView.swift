import SwiftUI

struct DashboardView: View {
    @EnvironmentObject private var store: Store
    @AppStorage("weeklyGoal") private var weeklyGoal = 4

    @State private var showAddExercise = false
    @State private var confirmDemo = false
    @State private var confirmReset = false
    @State private var pendingDelete: Exercise? = nil

    var body: some View {
        ZStack {
            AmbientBackground()

            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    header
                        .fadeUp(0)

                    if store.exercises.isEmpty {
                        EmptyStateCard(
                            onAdd: { showAddExercise = true },
                            onDemo: { withAnimation(.spring(response: 0.6, dampingFraction: 0.85)) { store.loadDemo() } }
                        )
                        .fadeUp(0.1)
                    } else {
                        heroCard
                            .fadeUp(0.05)
                        statsRow
                            .fadeUp(0.1)
                        ActivityHeatmap(volumes: store.dailyVolume)
                            .fadeUp(0.15)
                        exercisesSection
                            .fadeUp(0.2)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)
                .padding(.bottom, 40)
            }
            .scrollIndicators(.hidden)
        }
        .toolbar(.hidden, for: .navigationBar)
        .sheet(isPresented: $showAddExercise) {
            AddExerciseSheet()
                .environmentObject(store)
        }
        .confirmationDialog("Zastąpić obecne dane przykładowymi?", isPresented: $confirmDemo, titleVisibility: .visible) {
            Button("Wczytaj dane demo", role: .destructive) {
                withAnimation(.spring(response: 0.6, dampingFraction: 0.85)) { store.loadDemo() }
            }
        }
        .confirmationDialog("Usunąć wszystkie ćwiczenia i historię?", isPresented: $confirmReset, titleVisibility: .visible) {
            Button("Usuń wszystko", role: .destructive) {
                withAnimation(.spring(response: 0.6, dampingFraction: 0.85)) { store.resetAll() }
            }
        } message: {
            Text("Tej operacji nie można cofnąć.")
        }
        .confirmationDialog(
            "Usunąć ćwiczenie i całą jego historię?",
            isPresented: Binding(get: { pendingDelete != nil }, set: { if !$0 { pendingDelete = nil } }),
            titleVisibility: .visible,
            presenting: pendingDelete
        ) { exercise in
            Button("Usuń „\(exercise.name)”", role: .destructive) {
                withAnimation(.spring(response: 0.5, dampingFraction: 0.85)) {
                    store.deleteExercise(id: exercise.id)
                }
            }
        }
    }

    // MARK: Header

    private var header: some View {
        HStack(alignment: .center) {
            VStack(alignment: .leading, spacing: 4) {
                Eyebrow(Fmt.longDay(Date()))
                Text("Kinetic")
                    .font(.system(size: 34, weight: .semibold))
                    .foregroundStyle(Color.white)
            }
            Spacer()
            Menu {
                Picker("Cel tygodniowy", selection: $weeklyGoal) {
                    ForEach(2...7, id: \.self) { goal in
                        Text("\(goal) \(Fmt.plural(goal, one: "trening", few: "treningi", many: "treningów")) / tydz.")
                            .tag(goal)
                    }
                }
                .pickerStyle(.menu)

                Button {
                    if store.exercises.isEmpty {
                        withAnimation(.spring(response: 0.6, dampingFraction: 0.85)) { store.loadDemo() }
                    } else {
                        confirmDemo = true
                    }
                } label: {
                    Label("Wczytaj dane demo", systemImage: "sparkles")
                }

                Button(role: .destructive) {
                    confirmReset = true
                } label: {
                    Label("Usuń wszystkie dane", systemImage: "trash")
                }
            } label: {
                Image(systemName: "ellipsis")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(Color.white)
                    .frame(width: 40, height: 40)
                    .background(Circle().fill(Color.white.opacity(0.08)))
                    .overlay(Circle().strokeBorder(Color.white.opacity(0.12), lineWidth: 1))
            }
        }
        .padding(.top, 8)
    }

    // MARK: Hero

    private var heroCard: some View {
        let thisWeek = store.volume(weekOffset: 0)
        let lastWeek = store.volume(weekOffset: -1)
        let change: Double? = lastWeek > 0 ? (thisWeek - lastWeek) / lastWeek : nil
        let days = store.trainingDays(weekOffset: 0)

        return HStack(alignment: .center, spacing: 18) {
            VStack(alignment: .leading, spacing: 10) {
                Eyebrow("Wolumen · ten tydzień")
                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    CountingText(value: thisWeek, format: { Fmt.int($0) })
                        .font(.system(size: 44, weight: .light))
                        .foregroundStyle(Color.white)
                        .lineLimit(1)
                        .minimumScaleFactor(0.6)
                    Text("kg")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(Theme.textSecondary)
                }
                HStack(spacing: 8) {
                    DeltaChip(fraction: change)
                    Text("vs poprzedni")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(Theme.textTertiary)
                }
            }

            Spacer(minLength: 0)

            ZStack {
                GlowRing(progress: Double(days) / Double(max(weeklyGoal, 1)), lineWidth: 9)
                VStack(spacing: 0) {
                    Text("\(days)/\(weeklyGoal)")
                        .font(.system(size: 20, weight: .semibold))
                        .monospacedDigit()
                        .foregroundStyle(Color.white)
                    Text("dni")
                        .font(.system(size: 10, weight: .semibold))
                        .tracking(1)
                        .foregroundStyle(Theme.textTertiary)
                }
            }
            .frame(width: 92, height: 92)
        }
        .glassCard(padding: 20)
    }

    // MARK: Stats

    private var statsRow: some View {
        let streak = store.weekStreak
        return HStack(spacing: 10) {
            StatTile(
                symbol: "flame.fill",
                value: "\(streak)",
                unit: "tyg.",
                label: "Seria"
            )
            StatTile(
                symbol: "calendar",
                value: "\(store.totalSessions)",
                label: "Treningi"
            )
            StatTile(
                symbol: "trophy.fill",
                value: "\(store.recentPRCount)",
                label: "Rekordy · 30 dni"
            )
        }
    }

    // MARK: Exercises

    private var exercisesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Eyebrow("Ćwiczenia")
                Spacer()
                Button {
                    showAddExercise = true
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "plus")
                            .font(.system(size: 12, weight: .bold))
                        Text("Dodaj")
                            .font(.system(size: 13, weight: .semibold))
                    }
                    .foregroundStyle(Theme.accent)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 7)
                    .background(Capsule().fill(Theme.accent.opacity(0.12)))
                }
                .buttonStyle(PressableStyle())
            }
            .padding(.top, 6)

            LazyVStack(spacing: 10) {
                ForEach(store.sortedExercises) { exercise in
                    NavigationLink(value: exercise.id) {
                        ExerciseCard(exercise: exercise)
                    }
                    .buttonStyle(PressableStyle())
                    .contextMenu {
                        Button(role: .destructive) {
                            pendingDelete = exercise
                        } label: {
                            Label("Usuń ćwiczenie", systemImage: "trash")
                        }
                    }
                    .transition(.asymmetric(
                        insertion: .scale(scale: 0.95).combined(with: .opacity),
                        removal: .opacity
                    ))
                }
            }
        }
    }
}

// MARK: - Counting number

/// Text that rolls its digits whenever the value changes.
struct CountingText: View {
    let value: Double
    let format: (Double) -> String
    @State private var shown: Double = 0

    var body: some View {
        Text(format(shown))
            .monospacedDigit()
            .contentTransition(.numericText(value: shown))
            .onAppear {
                withAnimation(.spring(response: 1.0, dampingFraction: 0.9).delay(0.2)) {
                    shown = value
                }
            }
            .onChange(of: value) { _, newValue in
                withAnimation(.spring(response: 0.7, dampingFraction: 0.9)) {
                    shown = newValue
                }
            }
    }
}

// MARK: - Empty state

private struct EmptyStateCard: View {
    let onAdd: () -> Void
    let onDemo: () -> Void

    private let pattern: [Int] = [
        0, 1, 0, 2, 1, 3, 0, 2, 4, 1, 0, 3, 2, 4,
        1, 0, 2, 0, 3, 1, 2, 0, 1, 3, 4, 2, 3, 4,
        0, 2, 1, 3, 0, 2, 3, 1, 4, 2, 3, 4, 3, 4
    ]

    @State private var appeared = false

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            LazyVGrid(columns: Array(repeating: GridItem(.fixed(14), spacing: 5), count: 14), spacing: 5) {
                ForEach(Array(pattern.enumerated()), id: \.offset) { item in
                    RoundedRectangle(cornerRadius: 3.5, style: .continuous)
                        .fill(Theme.heatLevels[item.element])
                        .frame(width: 14, height: 14)
                        .shadow(color: item.element == 4 ? Theme.accent.opacity(0.6) : Color.clear, radius: 5)
                        .scaleEffect(appeared ? 1 : 0.2)
                        .opacity(appeared ? 1 : 0)
                        .animation(.spring(response: 0.5, dampingFraction: 0.7).delay(Double(item.offset % 14) * 0.03), value: appeared)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            VStack(alignment: .leading, spacing: 8) {
                Text("Zacznij śledzić swój progres")
                    .font(.system(size: 24, weight: .semibold))
                    .foregroundStyle(Color.white)
                Text("Dodaj ćwiczenia, zapisuj ciężar, powtórzenia i serie. Kinetic pokaże, jak rośnie Twoja siła — dzień po dniu.")
                    .font(.system(size: 15))
                    .foregroundStyle(Theme.textSecondary)
                    .fixedSize(horizontal: false, vertical: true)
            }

            VStack(spacing: 10) {
                GlowButton(title: "Dodaj pierwsze ćwiczenie", symbol: "plus", action: onAdd)
                GhostButton(title: "Wypróbuj z danymi demo", symbol: "sparkles", action: onDemo)
            }
        }
        .glassCard(padding: 22)
        .onAppear { appeared = true }
    }
}
