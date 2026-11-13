import SwiftUI

struct HeatCell: Hashable {
    let date: Date
    let volume: Double
    let level: Int
    let isFuture: Bool
    let isToday: Bool
}

/// Builds a weeks × 7 grid (Monday first) of training volume, GitHub style.
struct HeatmapData {
    let columns: [[HeatCell]]
    let monthLabels: [Int: String]
    let activeDays: Int

    init(volumes: [Date: Double], weeks: Int, calendar cal: Calendar = .kinetic, now: Date = Date()) {
        let today = cal.startOfDay(for: now)
        let thisWeek = cal.dateInterval(of: .weekOfYear, for: today)?.start ?? today
        let firstWeek = cal.date(byAdding: .weekOfYear, value: -(weeks - 1), to: thisWeek) ?? thisWeek

        // Scale levels against the busiest day in the window.
        var maxVolume: Double = 0
        var active = 0
        var grid: [[HeatCell]] = []
        var labels: [Int: String] = [:]

        var days: [[Date]] = []
        for w in 0..<weeks {
            var column: [Date] = []
            for d in 0..<7 {
                let offset = w * 7 + d
                let date = cal.date(byAdding: .day, value: offset, to: firstWeek) ?? firstWeek
                column.append(cal.startOfDay(for: date))
                let v = volumes[cal.startOfDay(for: date)] ?? 0
                if date <= today {
                    maxVolume = max(maxVolume, v)
                    if v > 0 { active += 1 }
                }
            }
            days.append(column)
        }

        for (w, column) in days.enumerated() {
            var cells: [HeatCell] = []
            for date in column {
                let v = volumes[date] ?? 0
                let level: Int
                if v <= 0 || maxVolume <= 0 {
                    level = 0
                } else {
                    let ratio = v / maxVolume
                    level = ratio < 0.25 ? 1 : (ratio < 0.5 ? 2 : (ratio < 0.75 ? 3 : 4))
                }
                cells.append(HeatCell(date: date, volume: v, level: level, isFuture: date > today, isToday: date == today))
                if cal.component(.day, from: date) == 1 {
                    labels[w] = Fmt.month(date)
                }
            }
            grid.append(cells)
        }

        // Label the first column too, unless a month label sits right next to it.
        if labels[0] == nil, labels[1] == nil, labels[2] == nil, let first = days.first?.first {
            labels[0] = Fmt.month(first)
        }

        columns = grid
        monthLabels = labels
        activeDays = active
    }
}

struct ActivityHeatmap: View {
    let volumes: [Date: Double]
    var weeks: Int = 26

    @State private var appeared = false
    @State private var selectedDay: HeatCell? = nil
    @State private var pulse = false

    private let cell: CGFloat = 14
    private let gap: CGFloat = 4
    private let dayLabels = ["Pn", "", "Śr", "", "Pt", "", "Nd"]

    var body: some View {
        let data = HeatmapData(volumes: volumes, weeks: weeks)

        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .firstTextBaseline) {
                Eyebrow("Aktywność")
                Spacer()
                Text("\(data.activeDays) \(Fmt.plural(data.activeDays, one: "trening", few: "treningi", many: "treningów")) · 6 mies.")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(Theme.textSecondary)
            }

            HStack(alignment: .top, spacing: 6) {
                VStack(alignment: .leading, spacing: gap) {
                    ForEach(0..<7, id: \.self) { row in
                        Text(dayLabels[row])
                            .font(.system(size: 9, weight: .medium))
                            .foregroundStyle(Theme.textTertiary)
                            .frame(height: cell)
                    }
                }
                .padding(.top, 18 + 4)

                ScrollView(.horizontal, showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 6) {
                        monthRow(data)
                        grid(data)
                    }
                    .padding(.vertical, 4)
                    .padding(.trailing, 2)
                }
                .defaultScrollAnchor(.trailing)
            }

            HStack(spacing: 6) {
                HStack(spacing: 0) {
                    if let day = selectedDay {
                        Text(Fmt.dayMonth(day.date))
                            .foregroundStyle(Color.white)
                        Text(day.volume > 0 ? "  ·  \(Fmt.int(day.volume)) kg" : "  ·  odpoczynek")
                            .foregroundStyle(Theme.textSecondary)
                    } else {
                        Text("Dotknij dzień")
                            .foregroundStyle(Theme.textTertiary)
                    }
                }
                .font(.system(size: 12, weight: .medium))
                .lineLimit(1)
                .minimumScaleFactor(0.8)
                .contentTransition(.opacity)

                Spacer(minLength: 8)

                Text("Mniej")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundStyle(Theme.textTertiary)
                ForEach(0..<Theme.heatLevels.count, id: \.self) { level in
                    RoundedRectangle(cornerRadius: 2.5, style: .continuous)
                        .fill(Theme.heatLevels[level])
                        .frame(width: 10, height: 10)
                }
                Text("Więcej")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundStyle(Theme.textTertiary)
            }
        }
        .glassCard(padding: 18)
        .sensoryFeedback(.selection, trigger: selectedDay)
        .onAppear {
            appeared = true
            withAnimation(.easeInOut(duration: 1.4).repeatForever(autoreverses: true)) {
                pulse = true
            }
        }
    }

    private func monthRow(_ data: HeatmapData) -> some View {
        HStack(spacing: gap) {
            ForEach(0..<data.columns.count, id: \.self) { w in
                Text(data.monthLabels[w] ?? "")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundStyle(Theme.textTertiary)
                    .fixedSize()
                    .frame(width: cell, height: 12, alignment: .leading)
            }
        }
    }

    private func grid(_ data: HeatmapData) -> some View {
        HStack(spacing: gap) {
            ForEach(0..<data.columns.count, id: \.self) { w in
                VStack(spacing: gap) {
                    ForEach(data.columns[w], id: \.self) { item in
                        cellView(item, column: w)
                    }
                }
            }
        }
    }

    private func cellView(_ item: HeatCell, column: Int) -> some View {
        let isSelected = selectedDay?.date == item.date
        let stroke: Color = isSelected ? Color.white : (item.isToday ? Theme.accent.opacity(pulse ? 1 : 0.35) : Color.clear)

        return RoundedRectangle(cornerRadius: 3.5, style: .continuous)
            .fill(item.isFuture ? Color.clear : Theme.heatLevels[item.level])
            .frame(width: cell, height: cell)
            .overlay(
                RoundedRectangle(cornerRadius: 3.5, style: .continuous)
                    .strokeBorder(stroke, lineWidth: 1.2)
            )
            .shadow(color: item.level >= 4 ? Theme.accent.opacity(0.6) : Color.clear, radius: 5)
            .scaleEffect(appeared ? (isSelected ? 1.3 : 1) : 0.2)
            .opacity(appeared ? 1 : 0)
            .animation(.spring(response: 0.55, dampingFraction: 0.7).delay(Double(column) * 0.018), value: appeared)
            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isSelected)
            .contentShape(Rectangle())
            .onTapGesture {
                guard !item.isFuture else { return }
                withAnimation(.easeOut(duration: 0.2)) {
                    selectedDay = isSelected ? nil : item
                }
            }
    }
}
