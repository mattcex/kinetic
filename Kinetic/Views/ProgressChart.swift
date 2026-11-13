import SwiftUI
import Charts

/// Glowing line + gradient area chart with drag-to-inspect.
struct ProgressChart: View {
    let points: [ChartPoint]
    @Binding var selected: ChartPoint?

    @State private var rawSelection: Date? = nil
    @State private var reveal: Double = 0

    private var domain: ClosedRange<Double> {
        let values = points.map(\.value)
        guard let lo = values.min(), let hi = values.max() else { return 0...1 }
        let pad = max((hi - lo) * 0.25, hi * 0.04, 1)
        return max(0, lo - pad)...(hi + pad)
    }

    var body: some View {
        ZStack {
            chart(glow: true)
                .blur(radius: 9)
                .opacity(0.9)
                .allowsHitTesting(false)
            chart(glow: false)
                .chartXSelection(value: $rawSelection)
        }
        .onAppear {
            withAnimation(.easeOut(duration: 1.1).delay(0.15)) {
                reveal = 1
            }
        }
        .onChange(of: rawSelection) { _, newValue in
            selected = nearest(to: newValue)
        }
        .sensoryFeedback(.selection, trigger: selected?.date)
    }

    private func nearest(to date: Date?) -> ChartPoint? {
        guard let date else { return nil }
        return points.min { abs($0.date.timeIntervalSince(date)) < abs($1.date.timeIntervalSince(date)) }
    }

    /// Values grow from the floor of the chart on first appearance.
    private func shown(_ value: Double) -> Double {
        let floor = domain.lowerBound
        return floor + (value - floor) * reveal
    }

    private func chart(glow: Bool) -> some View {
        let floor = domain.lowerBound
        let labelColor: Color = glow ? Color.clear : Theme.textTertiary
        let gridColor: Color = glow ? Color.clear : Color.white.opacity(0.07)

        return Chart {
            ForEach(points) { point in
                if !glow {
                    AreaMark(
                        x: .value("Data", point.date),
                        yStart: .value("Min", floor),
                        yEnd: .value("Wartość", shown(point.value))
                    )
                    .interpolationMethod(.monotone)
                    .foregroundStyle(
                        LinearGradient(
                            colors: [Theme.accent.opacity(0.30), Theme.accent.opacity(0)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                }

                LineMark(
                    x: .value("Data", point.date),
                    y: .value("Wartość", shown(point.value))
                )
                .interpolationMethod(.monotone)
                .foregroundStyle(Theme.accentGradient)
                .lineStyle(StrokeStyle(lineWidth: glow ? 6 : 2.5, lineCap: .round, lineJoin: .round))
            }

            if !glow, let point = selected {
                RuleMark(x: .value("Data", point.date))
                    .foregroundStyle(Color.white.opacity(0.28))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [3, 4]))

                PointMark(
                    x: .value("Data", point.date),
                    y: .value("Wartość", point.value)
                )
                .symbolSize(140)
                .foregroundStyle(Theme.accent)

                PointMark(
                    x: .value("Data", point.date),
                    y: .value("Wartość", point.value)
                )
                .symbolSize(36)
                .foregroundStyle(Color.white)
            } else if !glow, let last = points.last {
                PointMark(
                    x: .value("Data", last.date),
                    y: .value("Wartość", shown(last.value))
                )
                .symbolSize(70)
                .foregroundStyle(Color.white)
            }
        }
        .chartYScale(domain: domain)
        .chartLegend(.hidden)
        .chartXAxis {
            AxisMarks(values: .automatic(desiredCount: 4)) { _ in
                AxisValueLabel(format: .dateTime.day().month(.abbreviated))
                    .foregroundStyle(labelColor)
            }
        }
        .chartYAxis {
            AxisMarks(position: .trailing, values: .automatic(desiredCount: 4)) { _ in
                AxisGridLine(stroke: StrokeStyle(lineWidth: 0.6, dash: [2, 4]))
                    .foregroundStyle(gridColor)
                AxisValueLabel()
                    .foregroundStyle(labelColor)
            }
        }
    }
}
