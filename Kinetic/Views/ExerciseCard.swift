import SwiftUI

struct ExerciseCard: View {
    @EnvironmentObject private var store: Store
    let exercise: Exercise

    var body: some View {
        let entries = store.entries(for: exercise.id)
        let trend = Array(store.series(for: exercise.id, metric: .oneRM, since: nil).suffix(12).map(\.value))
        let best = store.bestWeight(for: exercise.id)
        let change: Double? = {
            guard trend.count > 1, let first = trend.first, let last = trend.last, first > 0 else { return nil }
            return (last - first) / first
        }()

        HStack(spacing: 14) {
            Image(systemName: exercise.group.symbol)
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(Theme.accent)
                .frame(width: 44, height: 44)
                .background(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .fill(Theme.accent.opacity(0.12))
                )

            VStack(alignment: .leading, spacing: 4) {
                Text(exercise.name)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(Color.white)
                    .lineLimit(1)
                    .minimumScaleFactor(0.85)
                Text(subtitle(entries))
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(Theme.textTertiary)
                    .lineLimit(1)
            }

            Spacer(minLength: 6)

            if trend.count > 1 {
                Sparkline(values: trend)
                    .frame(width: 58, height: 28)
            }

            VStack(alignment: .trailing, spacing: 3) {
                HStack(alignment: .firstTextBaseline, spacing: 2) {
                    Text(best.map { Fmt.weight($0) } ?? "—")
                        .font(.system(size: 19, weight: .semibold))
                        .monospacedDigit()
                        .foregroundStyle(Color.white)
                    if best != nil {
                        Text("kg")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(Theme.textSecondary)
                    }
                }
                DeltaChip(fraction: change, compact: true)
            }
            .frame(minWidth: 62, alignment: .trailing)
        }
        .glassCard(padding: 14, cornerRadius: 22)
        .contentShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
    }

    private func subtitle(_ entries: [LogEntry]) -> String {
        guard let last = entries.last else { return "\(exercise.group.label) · brak wpisów" }
        return "\(exercise.group.label) · \(Fmt.relative(last.date))"
    }
}
