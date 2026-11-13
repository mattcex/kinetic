import SwiftUI

struct ExerciseDetailView: View {
    @EnvironmentObject private var store: Store
    @Environment(\.dismiss) private var dismiss
    let exerciseID: UUID

    @State private var metric: ProgressMetric = .oneRM
    @State private var range: TimeRange = .half
    @State private var selected: ChartPoint? = nil
    @State private var showLog = false
    @State private var confirmDelete = false
    @State private var historyLimit = 12

    var body: some View {
        ZStack {
            AmbientBackground(intensity: 0.8)
            if let exercise = store.exercise(id: exerciseID) {
                content(exercise)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(.hidden, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button(role: .destructive) {
                        confirmDelete = true
                    } label: {
                        Label("Usuń ćwiczenie", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(Color.white)
                }
            }
        }
        .confirmationDialog("Usunąć ćwiczenie i całą jego historię?", isPresented: $confirmDelete, titleVisibility: .visible) {
            Button("Usuń", role: .destructive) {
                let id = exerciseID
                let target = store
                dismiss()
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.45) {
                    target.deleteExercise(id: id)
                }
            }
        }
        .sheet(isPresented: $showLog) {
            if let exercise = store.exercise(id: exerciseID) {
                LogEntrySheet(exercise: exercise)
                    .environmentObject(store)
            }
        }
        .onChange(of: metric) { _, _ in selected = nil }
        .onChange(of: range) { _, _ in selected = nil }
    }

    @ViewBuilder
    private func content(_ exercise: Exercise) -> some View {
        let points = store.series(for: exercise.id, metric: metric, since: range.startDate)

        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                header(exercise, points: points)
                    .fadeUp(0)

                PillPicker(options: ProgressMetric.allCases, selection: $metric) { $0.label }
                    .fadeUp(0.05)

                chartCard(points)
                    .fadeUp(0.1)

                statsGrid(exercise)
                    .fadeUp(0.15)

                history(exercise)
                    .fadeUp(0.2)
            }
            .padding(.horizontal, 20)
            .padding(.top, 4)
            .padding(.bottom, 24)
        }
        .scrollIndicators(.hidden)
        .safeAreaInset(edge: .bottom) {
            GlowButton(title: "Dodaj serię", symbol: "plus") {
                showLog = true
            }
            .padding(.horizontal, 20)
            .padding(.top, 8)
            .padding(.bottom, 6)
            .background(
                LinearGradient(colors: [Color.black.opacity(0), Color.black.opacity(0.85)], startPoint: .top, endPoint: .bottom)
                    .ignoresSafeArea()
            )
        }
    }

    // MARK: Header

    private func header(_ exercise: Exercise, points: [ChartPoint]) -> some View {
        let display = selected ?? points.last
        let first = points.first
        let last = points.last
        let change: Double? = {
            guard let first, let last, points.count > 1, first.value > 0 else { return nil }
            return (last.value - first.value) / first.value
        }()

        return VStack(alignment: .leading, spacing: 6) {
            Eyebrow(exercise.group.label, color: Theme.accent)
            Text(exercise.name)
                .font(.system(size: 30, weight: .semibold))
                .foregroundStyle(Color.white)
                .lineLimit(2)
                .minimumScaleFactor(0.8)

            HStack(alignment: .firstTextBaseline, spacing: 6) {
                Text(display.map { metric.format($0.value) } ?? "—")
                    .font(.system(size: 60, weight: .light))
                    .monospacedDigit()
                    .foregroundStyle(Color.white)
                    .contentTransition(.numericText(value: display?.value ?? 0))
                    .animation(.snappy, value: display?.value)
                Text("kg")
                    .font(.system(size: 18, weight: .medium))
                    .foregroundStyle(Theme.textSecondary)
            }
            .padding(.top, 6)

            HStack(spacing: 8) {
                if let point = selected {
                    Text(Fmt.longDay(point.date))
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(Theme.textSecondary)
                } else if change != nil {
                    DeltaChip(fraction: change)
                    Text(range.caption)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(Theme.textTertiary)
                } else {
                    Text(points.isEmpty ? "Brak wpisów w tym okresie" : "Dodaj kolejne serie, aby zobaczyć trend")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(Theme.textTertiary)
                }
            }
            .frame(height: 24)
        }
        .padding(.top, 4)
    }

    // MARK: Chart

    private func chartCard(_ points: [ChartPoint]) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Group {
                if points.isEmpty {
                    VStack(spacing: 10) {
                        Image(systemName: "chart.xyaxis.line")
                            .font(.system(size: 28, weight: .light))
                            .foregroundStyle(Theme.textTertiary)
                        Text("Brak danych w tym zakresie")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(Theme.textTertiary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ProgressChart(points: points, selected: $selected)
                        .id("\(metric.rawValue)-\(range.rawValue)")
                        .transition(.opacity)
                }
            }
            .frame(height: 220)

            PillPicker(options: TimeRange.allCases, selection: $range) { $0.label }
        }
        .glassCard(padding: 16)
    }

    // MARK: Stats

    private func statsGrid(_ exercise: Exercise) -> some View {
        let entries = store.entries(for: exercise.id)
        let best1RM = store.bestOneRM(for: exercise.id)
        let bestWeight = store.bestWeight(for: exercise.id)
        let sessions = Set(entries.map { Calendar.kinetic.startOfDay(for: $0.date) }).count
        let totalVolume = entries.reduce(0) { $0 + $1.volume }

        return LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
            StatTile(symbol: "trophy.fill", value: best1RM.map { Fmt.weight($0) } ?? "—", unit: "kg", label: "Rekord · szac. 1RM")
            StatTile(symbol: "scalemass.fill", value: bestWeight.map { Fmt.weight($0) } ?? "—", unit: "kg", label: "Najcięższa seria")
            StatTile(symbol: "calendar", value: "\(sessions)", label: "Sesje")
            StatTile(
                symbol: "chart.bar.fill",
                value: totalVolume >= 10_000 ? Fmt.weight(totalVolume / 1000) : Fmt.int(totalVolume),
                unit: totalVolume >= 10_000 ? "t" : "kg",
                label: "Wolumen łącznie"
            )
        }
    }

    // MARK: History

    private func history(_ exercise: Exercise) -> some View {
        let entries = Array(store.entries(for: exercise.id).reversed())
        let prs = store.prEntryIDs(for: exercise.id)

        return VStack(alignment: .leading, spacing: 12) {
            Eyebrow("Historia")
                .padding(.top, 6)

            if entries.isEmpty {
                Text("Jeszcze nic tu nie ma. Dodaj pierwszą serię przyciskiem poniżej.")
                    .font(.system(size: 14))
                    .foregroundStyle(Theme.textSecondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .glassCard(padding: 16, cornerRadius: 20)
            } else {
                VStack(spacing: 0) {
                    ForEach(Array(entries.prefix(historyLimit).enumerated()), id: \.element.id) { item in
                        HistoryRow(entry: item.element, isPR: prs.contains(item.element.id))
                            .contextMenu {
                                Button(role: .destructive) {
                                    withAnimation(.spring(response: 0.4, dampingFraction: 0.85)) {
                                        store.deleteEntry(id: item.element.id)
                                    }
                                } label: {
                                    Label("Usuń wpis", systemImage: "trash")
                                }
                            }
                        if item.offset < min(historyLimit, entries.count) - 1 {
                            Divider().overlay(Color.white.opacity(0.06))
                        }
                    }
                }
                .glassCard(padding: 6, cornerRadius: 22)

                if entries.count > historyLimit {
                    Button {
                        withAnimation(.spring(response: 0.5, dampingFraction: 0.85)) {
                            historyLimit += 20
                        }
                    } label: {
                        Text("Pokaż więcej")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(Theme.accent)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                    }
                    .buttonStyle(PressableStyle())
                }
            }
        }
    }
}

private struct HistoryRow: View {
    let entry: LogEntry
    let isPR: Bool

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 3) {
                Text(Fmt.dayMonth(entry.date))
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Color.white)
                Text("1RM \(Fmt.weight(entry.estimatedOneRM)) kg")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(Theme.textTertiary)
            }

            if isPR {
                HStack(spacing: 3) {
                    Image(systemName: "trophy.fill")
                        .font(.system(size: 9, weight: .bold))
                    Text("PR")
                        .font(.system(size: 10, weight: .heavy))
                        .tracking(0.8)
                }
                .foregroundStyle(Color.black)
                .padding(.horizontal, 7)
                .padding(.vertical, 4)
                .background(Capsule().fill(Theme.accentGradient))
                .shadow(color: Theme.accent.opacity(0.5), radius: 6)
            }

            Spacer()

            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text(Fmt.weight(entry.weight))
                    .font(.system(size: 17, weight: .semibold))
                    .monospacedDigit()
                    .foregroundStyle(Color.white)
                Text("kg")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(Theme.textSecondary)
                Text("× \(entry.reps) × \(entry.sets)")
                    .font(.system(size: 14, weight: .medium))
                    .monospacedDigit()
                    .foregroundStyle(Theme.textSecondary)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 12)
        .contentShape(Rectangle())
    }
}
