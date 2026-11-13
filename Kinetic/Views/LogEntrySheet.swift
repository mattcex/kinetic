import SwiftUI

struct LogEntrySheet: View {
    @EnvironmentObject private var store: Store
    @Environment(\.dismiss) private var dismiss
    let exercise: Exercise

    @State private var weightText = ""
    @State private var reps = 5
    @State private var sets = 3
    @State private var date = Date()
    @State private var celebrate = false
    @State private var saved = 0
    @FocusState private var weightFocused: Bool

    private var weight: Double {
        Double(weightText.replacingOccurrences(of: ",", with: ".").trimmingCharacters(in: .whitespaces)) ?? 0
    }

    private var oneRM: Double { LogEntry.oneRM(weight: weight, reps: reps) }
    private var previousBest: Double? { store.bestOneRM(for: exercise.id) }

    private var isRecord: Bool {
        guard let previousBest, weight > 0 else { return false }
        return oneRM > previousBest + 0.01
    }

    var body: some View {
        ZStack {
            AmbientBackground(intensity: isRecord ? 1.3 : 0.7)
                .animation(.easeInOut(duration: 0.6), value: isRecord)

            ScrollView {
                VStack(spacing: 18) {
                    VStack(spacing: 6) {
                        Eyebrow("Nowa seria", color: Theme.accent)
                        Text(exercise.name)
                            .font(.system(size: 22, weight: .semibold))
                            .foregroundStyle(Color.white)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.top, 28)

                    weightBlock

                    quickAdjust

                    CounterRow(title: "Powtórzenia", value: $reps, range: 1...50)
                    CounterRow(title: "Serie", value: $sets, range: 1...20)

                    HStack {
                        Text("Data")
                            .font(.system(size: 15, weight: .medium))
                            .foregroundStyle(Theme.textSecondary)
                        Spacer()
                        DatePicker("Data", selection: $date, in: ...Date(), displayedComponents: .date)
                            .labelsHidden()
                    }
                    .glassCard(padding: 14, cornerRadius: 20)

                    summary
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 20)
            }
            .scrollIndicators(.hidden)
            .scrollDismissesKeyboard(.interactively)
            .safeAreaInset(edge: .bottom) {
                GlowButton(title: isRecord ? "Zapisz rekord" : "Zapisz", symbol: isRecord ? "trophy.fill" : "checkmark") {
                    save()
                }
                .disabled(weight <= 0)
                .opacity(weight <= 0 ? 0.4 : 1)
                .padding(.horizontal, 20)
                .padding(.bottom, 8)
            }

            if celebrate {
                RecordCelebration(value: oneRM)
                    .transition(.opacity.combined(with: .scale(scale: 0.85)))
            }
        }
        .presentationDragIndicator(.visible)
        .presentationBackground(Color.black)
        .presentationCornerRadius(32)
        .sensoryFeedback(.success, trigger: celebrate) { _, newValue in newValue }
        .sensoryFeedback(.impact(weight: .medium), trigger: saved)
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("Gotowe") { weightFocused = false }
                    .fontWeight(.semibold)
            }
        }
        .onAppear(perform: prefill)
    }

    // MARK: Weight

    private var weightBlock: some View {
        HStack(spacing: 14) {
            RoundIconButton(symbol: "minus", size: 48) { adjust(-2.5) }

            VStack(spacing: 2) {
                TextField("0", text: $weightText)
                    .keyboardType(.decimalPad)
                    .focused($weightFocused)
                    .multilineTextAlignment(.center)
                    .font(.system(size: 68, weight: .light))
                    .monospacedDigit()
                    .foregroundStyle(Color.white)
                    .minimumScaleFactor(0.5)
                    .lineLimit(1)
                Text("KILOGRAMY")
                    .font(.system(size: 10, weight: .semibold))
                    .tracking(2)
                    .foregroundStyle(Theme.textTertiary)
            }
            .frame(maxWidth: .infinity)

            RoundIconButton(symbol: "plus", size: 48, filled: true) { adjust(2.5) }
        }
        .padding(.vertical, 6)
        .glassCard(padding: 18)
    }

    private var quickAdjust: some View {
        HStack(spacing: 8) {
            ForEach([-10.0, -5.0, 5.0, 10.0], id: \.self) { step in
                Button {
                    adjust(step)
                } label: {
                    Text(step > 0 ? "+\(Fmt.weight(step))" : "−\(Fmt.weight(-step))")
                        .font(.system(size: 14, weight: .semibold))
                        .monospacedDigit()
                        .foregroundStyle(step > 0 ? Theme.accent : Theme.textSecondary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(Capsule().fill(Color.white.opacity(0.06)))
                        .overlay(Capsule().strokeBorder(Color.white.opacity(0.08), lineWidth: 1))
                }
                .buttonStyle(PressableStyle())
            }
        }
    }

    // MARK: Summary

    private var summary: some View {
        HStack(spacing: 10) {
            summaryTile(title: "Szac. 1RM", value: weight > 0 ? Fmt.weight(oneRM) : "—", unit: "kg", highlight: isRecord)
            summaryTile(title: "Wolumen", value: weight > 0 ? Fmt.int(weight * Double(reps * sets)) : "—", unit: "kg", highlight: false)
            summaryTile(title: "Rekord", value: previousBest.map { Fmt.weight($0) } ?? "—", unit: "kg", highlight: false)
        }
    }

    private func summaryTile(title: String, value: String, unit: String, highlight: Bool) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title.uppercased())
                .font(.system(size: 9, weight: .semibold))
                .tracking(1.2)
                .foregroundStyle(highlight ? Theme.accent : Theme.textTertiary)
                .lineLimit(1)
            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Text(value)
                    .font(.system(size: 18, weight: .semibold))
                    .monospacedDigit()
                    .foregroundStyle(highlight ? Theme.accent : Color.white)
                    .lineLimit(1)
                    .minimumScaleFactor(0.6)
                    .contentTransition(.numericText())
                    .animation(.snappy, value: value)
                Text(unit)
                    .font(.system(size: 10, weight: .medium))
                    .foregroundStyle(Theme.textSecondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .glassCard(padding: 12, cornerRadius: 18)
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(Theme.accent.opacity(highlight ? 0.7 : 0), lineWidth: 1)
                .shadow(color: Theme.accent.opacity(highlight ? 0.6 : 0), radius: 8)
        )
        .animation(.easeInOut(duration: 0.3), value: highlight)
    }

    // MARK: Actions

    private func prefill() {
        if let last = store.entries(for: exercise.id).last {
            weightText = Fmt.weightInput(last.weight)
            reps = last.reps
            sets = last.sets
        } else {
            weightText = "20"
        }
    }

    private func adjust(_ delta: Double) {
        let next = max(0, ((weight + delta) * 4).rounded() / 4)
        withAnimation(.snappy) {
            weightText = Fmt.weightInput(next)
        }
    }

    private func save() {
        guard weight > 0 else { return }
        let wasRecord = isRecord
        weightFocused = false
        store.addEntry(LogEntry(exerciseID: exercise.id, date: date, weight: weight, reps: reps, sets: sets))
        saved += 1

        if wasRecord {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.7)) {
                celebrate = true
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.8) {
                dismiss()
            }
        } else {
            dismiss()
        }
    }
}

// MARK: - Counter row

private struct CounterRow: View {
    let title: String
    @Binding var value: Int
    let range: ClosedRange<Int>

    var body: some View {
        HStack {
            Text(title)
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(Theme.textSecondary)
            Spacer()
            HStack(spacing: 16) {
                RoundIconButton(symbol: "minus", size: 38) {
                    guard value > range.lowerBound else { return }
                    withAnimation(.snappy) { value -= 1 }
                }
                Text("\(value)")
                    .font(.system(size: 26, weight: .semibold))
                    .monospacedDigit()
                    .foregroundStyle(Color.white)
                    .frame(minWidth: 40)
                    .contentTransition(.numericText(value: Double(value)))
                RoundIconButton(symbol: "plus", size: 38) {
                    guard value < range.upperBound else { return }
                    withAnimation(.snappy) { value += 1 }
                }
            }
        }
        .glassCard(padding: 14, cornerRadius: 20)
        .sensoryFeedback(.selection, trigger: value)
    }
}

// MARK: - Celebration

private struct RecordCelebration: View {
    let value: Double
    @State private var burst = false

    var body: some View {
        ZStack {
            Color.black.opacity(0.75)
                .ignoresSafeArea()

            Circle()
                .fill(Theme.accent.opacity(0.35))
                .frame(width: 260, height: 260)
                .blur(radius: 70)
                .scaleEffect(burst ? 1.3 : 0.6)

            ForEach(0..<12, id: \.self) { index in
                Capsule()
                    .fill(Theme.accentGradient)
                    .frame(width: 4, height: 18)
                    .offset(y: burst ? -150 : -60)
                    .rotationEffect(.degrees(Double(index) / 12 * 360))
                    .opacity(burst ? 0 : 1)
            }

            VStack(spacing: 10) {
                Image(systemName: "trophy.fill")
                    .font(.system(size: 52, weight: .semibold))
                    .foregroundStyle(Theme.accentGradient)
                    .shadow(color: Theme.accent.opacity(0.8), radius: 20)
                    .scaleEffect(burst ? 1 : 0.4)
                Text("NOWY REKORD")
                    .font(.system(size: 13, weight: .bold))
                    .tracking(3)
                    .foregroundStyle(Theme.accent)
                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text(Fmt.weight(value))
                        .font(.system(size: 54, weight: .light))
                        .monospacedDigit()
                        .foregroundStyle(Color.white)
                    Text("kg")
                        .font(.system(size: 18, weight: .medium))
                        .foregroundStyle(Theme.textSecondary)
                }
                Text("szacowane 1RM")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(Theme.textTertiary)
            }
        }
        .onAppear {
            withAnimation(.spring(response: 0.9, dampingFraction: 0.6)) {
                burst = true
            }
        }
    }
}
