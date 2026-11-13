import SwiftUI
import Charts

// MARK: - Buttons

struct GlowButton: View {
    let title: String
    var symbol: String? = nil
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if let symbol {
                    Image(systemName: symbol)
                        .font(.system(size: 15, weight: .bold))
                }
                Text(title)
                    .font(.system(size: 16, weight: .semibold))
            }
            .foregroundStyle(Color.black)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 17)
            .background(Capsule().fill(Theme.accentGradient))
            .shadow(color: Theme.accent.opacity(0.45), radius: 18, x: 0, y: 6)
        }
        .buttonStyle(PressableStyle())
    }
}

struct GhostButton: View {
    let title: String
    var symbol: String? = nil
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if let symbol {
                    Image(systemName: symbol)
                        .font(.system(size: 14, weight: .semibold))
                }
                Text(title)
                    .font(.system(size: 15, weight: .semibold))
            }
            .foregroundStyle(Color.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 15)
            .background(Capsule().fill(Color.white.opacity(0.07)))
            .overlay(Capsule().strokeBorder(Color.white.opacity(0.12), lineWidth: 1))
        }
        .buttonStyle(PressableStyle())
    }
}

struct RoundIconButton: View {
    let symbol: String
    var size: CGFloat = 40
    var filled: Bool = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: symbol)
                .font(.system(size: size * 0.38, weight: .semibold))
                .foregroundStyle(filled ? Color.black : Color.white)
                .frame(width: size, height: size)
                .background(
                    Circle().fill(filled ? AnyShapeStyle(Theme.accentGradient) : AnyShapeStyle(Color.white.opacity(0.08)))
                )
                .overlay(Circle().strokeBorder(Color.white.opacity(filled ? 0 : 0.12), lineWidth: 1))
                .shadow(color: filled ? Theme.accent.opacity(0.5) : Color.clear, radius: 12)
        }
        .buttonStyle(PressableStyle())
    }
}

// MARK: - Stat tile

struct StatTile: View {
    let symbol: String
    let value: String
    var unit: String? = nil
    let label: String

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Image(systemName: symbol)
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(Theme.accent)
                .frame(width: 28, height: 28)
                .background(Circle().fill(Theme.accent.opacity(0.12)))

            HStack(alignment: .firstTextBaseline, spacing: 3) {
                Text(value)
                    .font(.system(size: 24, weight: .semibold))
                    .monospacedDigit()
                    .foregroundStyle(Color.white)
                    .lineLimit(1)
                    .minimumScaleFactor(0.6)
                if let unit {
                    Text(unit)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(Theme.textSecondary)
                }
            }

            Text(label)
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(Theme.textTertiary)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .glassCard(padding: 14, cornerRadius: 20)
    }
}

// MARK: - Ring

struct GlowRing: View {
    let progress: Double
    var lineWidth: CGFloat = 10
    @State private var animated: Double = 0

    var body: some View {
        ZStack {
            Circle()
                .stroke(Color.white.opacity(0.08), lineWidth: lineWidth)
            Circle()
                .trim(from: 0, to: animated)
                .stroke(
                    AngularGradient(colors: [Theme.mint, Theme.accent, Theme.mint], center: .center),
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .shadow(color: Theme.accent.opacity(0.6), radius: 8)
                .opacity(animated > 0.001 ? 1 : 0)
        }
        .onAppear {
            withAnimation(.spring(response: 1.3, dampingFraction: 0.85).delay(0.25)) {
                animated = min(max(progress, 0), 1)
            }
        }
        .onChange(of: progress) { _, newValue in
            withAnimation(.spring(response: 0.8, dampingFraction: 0.85)) {
                animated = min(max(newValue, 0), 1)
            }
        }
    }
}

// MARK: - Pill picker

struct PillPicker<Option: Hashable & Identifiable>: View {
    let options: [Option]
    @Binding var selection: Option
    let label: (Option) -> String
    @Namespace private var pillSpace

    var body: some View {
        HStack(spacing: 4) {
            ForEach(options) { option in
                let isOn = option == selection
                Button {
                    withAnimation(.spring(response: 0.42, dampingFraction: 0.82)) {
                        selection = option
                    }
                } label: {
                    Text(label(option))
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(isOn ? Color.black : Theme.textSecondary)
                        .padding(.vertical, 8)
                        .frame(maxWidth: .infinity)
                        .background {
                            if isOn {
                                Capsule()
                                    .fill(Theme.accentGradient)
                                    .shadow(color: Theme.accent.opacity(0.45), radius: 10)
                                    .matchedGeometryEffect(id: "pill", in: pillSpace)
                            }
                        }
                        .contentShape(Capsule())
                }
                .buttonStyle(.plain)
            }
        }
        .padding(4)
        .background(Capsule().fill(Color.white.opacity(0.06)))
        .overlay(Capsule().strokeBorder(Color.white.opacity(0.08), lineWidth: 1))
        .sensoryFeedback(.selection, trigger: selection)
    }
}

// MARK: - Delta chip

struct DeltaChip: View {
    /// Fractional change, e.g. 0.12 for +12 %.
    let fraction: Double?
    var compact: Bool = false

    var body: some View {
        let value = fraction ?? 0
        let isUp = value > 0.0005
        let isDown = value < -0.0005
        let color: Color = isUp ? Theme.accent : (isDown ? Theme.danger : Theme.textTertiary)
        let symbol = isUp ? "arrow.up.right" : (isDown ? "arrow.down.right" : "minus")

        HStack(spacing: 3) {
            Image(systemName: symbol)
                .font(.system(size: compact ? 9 : 10, weight: .bold))
            Text(fraction == nil ? "—" : Fmt.percent(abs(value)))
                .font(.system(size: compact ? 11 : 12, weight: .semibold))
                .monospacedDigit()
        }
        .foregroundStyle(color)
        .padding(.horizontal, compact ? 0 : 8)
        .padding(.vertical, compact ? 0 : 4)
        .background {
            if !compact {
                Capsule().fill(color.opacity(0.12))
            }
        }
    }
}

// MARK: - Sparkline

struct Sparkline: View {
    let values: [Double]
    var color: Color = Theme.accent

    private var points: [Double] {
        if values.count == 1, let only = values.first { return [only, only] }
        return values
    }

    private var domain: ClosedRange<Double> {
        guard let lo = points.min(), let hi = points.max() else { return 0...1 }
        let pad = max((hi - lo) * 0.2, 0.5)
        return (lo - pad)...(hi + pad)
    }

    var body: some View {
        let lower = domain.lowerBound
        Chart {
            ForEach(Array(points.enumerated()), id: \.offset) { item in
                AreaMark(
                    x: .value("i", item.offset),
                    yStart: .value("min", lower),
                    yEnd: .value("v", item.element)
                )
                .interpolationMethod(.monotone)
                .foregroundStyle(
                    LinearGradient(
                        colors: [color.opacity(0.32), color.opacity(0)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )

                LineMark(
                    x: .value("i", item.offset),
                    y: .value("v", item.element)
                )
                .interpolationMethod(.monotone)
                .foregroundStyle(color)
                .lineStyle(StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round))
            }
        }
        .chartXAxis(.hidden)
        .chartYAxis(.hidden)
        .chartLegend(.hidden)
        .chartYScale(domain: domain)
        .shadow(color: color.opacity(0.5), radius: 4)
    }
}

// MARK: - Formatting

enum Fmt {
    static let locale = Locale(identifier: "pl_PL")

    private static let integerFormatter: NumberFormatter = {
        let f = NumberFormatter()
        f.locale = Fmt.locale
        f.numberStyle = .decimal
        f.maximumFractionDigits = 0
        return f
    }()

    private static let weightFormatter: NumberFormatter = {
        let f = NumberFormatter()
        f.locale = Fmt.locale
        f.numberStyle = .decimal
        f.minimumFractionDigits = 0
        f.maximumFractionDigits = 1
        return f
    }()

    private static let inputFormatter: NumberFormatter = {
        let f = NumberFormatter()
        f.locale = Fmt.locale
        f.numberStyle = .decimal
        f.usesGroupingSeparator = false
        f.minimumFractionDigits = 0
        f.maximumFractionDigits = 2
        return f
    }()

    private static func dateFormatter(_ format: String) -> DateFormatter {
        let f = DateFormatter()
        f.locale = Fmt.locale
        f.calendar = Calendar.kinetic
        f.dateFormat = format
        return f
    }

    private static let dayMonthFormatter = Fmt.dateFormatter("d MMM")
    private static let longDayFormatter = Fmt.dateFormatter("EEEE, d MMMM")
    private static let monthFormatter = Fmt.dateFormatter("LLL")

    static func int(_ value: Double) -> String {
        integerFormatter.string(from: NSNumber(value: value.rounded())) ?? "\(Int(value))"
    }

    static func weight(_ value: Double) -> String {
        weightFormatter.string(from: NSNumber(value: value)) ?? String(format: "%.1f", value)
    }

    static func weightInput(_ value: Double) -> String {
        inputFormatter.string(from: NSNumber(value: value)) ?? "\(value)"
    }

    static func percent(_ fraction: Double) -> String {
        let pct = fraction * 100
        if pct >= 10 { return "\(Int(pct.rounded()))%" }
        return weight(pct) + "%"
    }

    static func dayMonth(_ date: Date) -> String { dayMonthFormatter.string(from: date) }
    static func longDay(_ date: Date) -> String { longDayFormatter.string(from: date) }
    static func month(_ date: Date) -> String { monthFormatter.string(from: date) }

    static func relative(_ date: Date) -> String {
        let cal = Calendar.kinetic
        let days = cal.dateComponents([.day], from: cal.startOfDay(for: date), to: cal.startOfDay(for: Date())).day ?? 0
        switch days {
        case ..<1: return "dziś"
        case 1: return "wczoraj"
        case 2..<14: return "\(days) dni temu"
        default: return "\(days / 7) tyg. temu"
        }
    }

    /// Polish plural: 1 trening, 2–4 treningi, 5+ treningów.
    static func plural(_ n: Int, one: String, few: String, many: String) -> String {
        if n == 1 { return one }
        let mod10 = n % 10
        let mod100 = n % 100
        if (2...4).contains(mod10) && !(12...14).contains(mod100) { return few }
        return many
    }
}
