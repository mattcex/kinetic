import Foundation

enum MuscleGroup: String, Codable, CaseIterable, Identifiable {
    case chest, back, legs, shoulders, arms, core, other

    var id: String { rawValue }

    var label: String {
        switch self {
        case .chest: return "Klatka"
        case .back: return "Plecy"
        case .legs: return "Nogi"
        case .shoulders: return "Barki"
        case .arms: return "Ramiona"
        case .core: return "Core"
        case .other: return "Inne"
        }
    }

    var symbol: String {
        switch self {
        case .chest: return "figure.strengthtraining.traditional"
        case .back: return "figure.rower"
        case .legs: return "figure.step.training"
        case .shoulders: return "figure.arms.open"
        case .arms: return "dumbbell.fill"
        case .core: return "figure.core.training"
        case .other: return "bolt.fill"
        }
    }
}

struct Exercise: Identifiable, Codable, Hashable {
    var id: UUID = UUID()
    var name: String
    var group: MuscleGroup
    var createdAt: Date = Date()
}

struct LogEntry: Identifiable, Codable, Hashable {
    var id: UUID = UUID()
    var exerciseID: UUID
    var date: Date
    var weight: Double
    var reps: Int
    var sets: Int

    var volume: Double { weight * Double(reps * sets) }
    var estimatedOneRM: Double { LogEntry.oneRM(weight: weight, reps: reps) }

    /// Epley formula.
    static func oneRM(weight: Double, reps: Int) -> Double {
        guard reps > 1 else { return weight }
        return weight * (1 + Double(reps) / 30)
    }
}

struct ChartPoint: Identifiable, Equatable {
    let date: Date
    let value: Double
    var id: Date { date }
}

enum ProgressMetric: String, CaseIterable, Identifiable {
    case oneRM, maxWeight, volume

    var id: String { rawValue }

    var label: String {
        switch self {
        case .oneRM: return "Szac. 1RM"
        case .maxWeight: return "Ciężar"
        case .volume: return "Wolumen"
        }
    }

    func format(_ value: Double) -> String {
        switch self {
        case .volume: return Fmt.int(value)
        default: return Fmt.weight(value)
        }
    }
}

enum TimeRange: String, CaseIterable, Identifiable {
    case month, quarter, half, year, all

    var id: String { rawValue }

    var label: String {
        switch self {
        case .month: return "1M"
        case .quarter: return "3M"
        case .half: return "6M"
        case .year: return "1R"
        case .all: return "Całość"
        }
    }

    var caption: String {
        switch self {
        case .month: return "w ostatnim miesiącu"
        case .quarter: return "w 3 miesiące"
        case .half: return "w pół roku"
        case .year: return "w rok"
        case .all: return "od początku"
        }
    }

    var startDate: Date? {
        let months: Int
        switch self {
        case .month: months = 1
        case .quarter: months = 3
        case .half: months = 6
        case .year: months = 12
        case .all: return nil
        }
        return Calendar.kinetic.date(byAdding: .month, value: -months, to: Date())
    }
}
