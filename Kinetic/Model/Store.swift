import Foundation
import SwiftUI

/// Holds all exercises and logged sets, persisted as JSON in Documents.
final class Store: ObservableObject {
    @Published private(set) var exercises: [Exercise] = []
    @Published private(set) var entries: [LogEntry] = []

    private let fileURL: URL
    private var cal: Calendar { Calendar.kinetic }

    private struct Snapshot: Codable {
        var exercises: [Exercise]
        var entries: [LogEntry]
    }

    init() {
        let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        fileURL = documents.appendingPathComponent("kinetic-data.json")
        load()
    }

    // MARK: Persistence

    private func load() {
        guard let data = try? Data(contentsOf: fileURL),
              let snapshot = try? JSONDecoder().decode(Snapshot.self, from: data) else { return }
        exercises = snapshot.exercises
        entries = snapshot.entries
    }

    private func save() {
        let snapshot = Snapshot(exercises: exercises, entries: entries)
        do {
            let data = try JSONEncoder().encode(snapshot)
            try data.write(to: fileURL, options: .atomic)
        } catch {
            print("Kinetic: save failed – \(error)")
        }
    }

    // MARK: Mutations

    @discardableResult
    func addExercise(name: String, group: MuscleGroup) -> Exercise {
        let exercise = Exercise(name: name, group: group)
        exercises.append(exercise)
        save()
        return exercise
    }

    func deleteExercise(id: UUID) {
        exercises.removeAll { $0.id == id }
        entries.removeAll { $0.exerciseID == id }
        save()
    }

    func addEntry(_ entry: LogEntry) {
        entries.append(entry)
        save()
    }

    func deleteEntry(id: UUID) {
        entries.removeAll { $0.id == id }
        save()
    }

    func loadDemo() {
        let demo = DemoData.make()
        exercises = demo.exercises
        entries = demo.entries
        save()
    }

    func resetAll() {
        exercises = []
        entries = []
        save()
    }

    // MARK: Queries

    func exercise(id: UUID) -> Exercise? {
        exercises.first { $0.id == id }
    }

    /// Exercises ordered by most recent activity.
    var sortedExercises: [Exercise] {
        var lastDate: [UUID: Date] = [:]
        for entry in entries {
            if let current = lastDate[entry.exerciseID], current >= entry.date { continue }
            lastDate[entry.exerciseID] = entry.date
        }
        return exercises.sorted {
            (lastDate[$0.id] ?? $0.createdAt) > (lastDate[$1.id] ?? $1.createdAt)
        }
    }

    func entries(for exerciseID: UUID) -> [LogEntry] {
        entries.filter { $0.exerciseID == exerciseID }.sorted { $0.date < $1.date }
    }

    func bestOneRM(for exerciseID: UUID) -> Double? {
        entries.filter { $0.exerciseID == exerciseID }.map(\.estimatedOneRM).max()
    }

    func bestWeight(for exerciseID: UUID) -> Double? {
        entries.filter { $0.exerciseID == exerciseID }.map(\.weight).max()
    }

    /// One point per training day for the chosen metric.
    func series(for exerciseID: UUID, metric: ProgressMetric, since start: Date?) -> [ChartPoint] {
        var byDay: [Date: Double] = [:]
        for entry in entries where entry.exerciseID == exerciseID {
            if let start, entry.date < start { continue }
            let day = cal.startOfDay(for: entry.date)
            switch metric {
            case .oneRM:
                byDay[day] = max(byDay[day] ?? 0, entry.estimatedOneRM)
            case .maxWeight:
                byDay[day] = max(byDay[day] ?? 0, entry.weight)
            case .volume:
                byDay[day, default: 0] += entry.volume
            }
        }
        return byDay
            .map { ChartPoint(date: $0.key, value: $0.value) }
            .sorted { $0.date < $1.date }
    }

    /// Entries that beat every earlier estimated 1RM for their exercise.
    func prEntryIDs(for exerciseID: UUID? = nil) -> Set<UUID> {
        var best: [UUID: Double] = [:]
        var result: Set<UUID> = []
        let source = entries
            .filter { exerciseID == nil || $0.exerciseID == exerciseID }
            .sorted { $0.date < $1.date }
        for entry in source {
            let value = entry.estimatedOneRM
            if let previous = best[entry.exerciseID] {
                if value > previous + 0.01 {
                    result.insert(entry.id)
                    best[entry.exerciseID] = value
                }
            } else {
                best[entry.exerciseID] = value
            }
        }
        return result
    }

    var recentPRCount: Int {
        guard let since = cal.date(byAdding: .day, value: -30, to: Date()) else { return 0 }
        let ids = prEntryIDs()
        return entries.filter { ids.contains($0.id) && $0.date >= since }.count
    }

    var dailyVolume: [Date: Double] {
        var map: [Date: Double] = [:]
        for entry in entries {
            map[cal.startOfDay(for: entry.date), default: 0] += entry.volume
        }
        return map
    }

    var totalSessions: Int {
        Set(entries.map { cal.startOfDay(for: $0.date) }).count
    }

    private func weekInterval(offset: Int) -> DateInterval? {
        guard let thisWeek = cal.dateInterval(of: .weekOfYear, for: Date()),
              let start = cal.date(byAdding: .weekOfYear, value: offset, to: thisWeek.start),
              let end = cal.date(byAdding: .weekOfYear, value: 1, to: start) else { return nil }
        return DateInterval(start: start, end: end)
    }

    /// offset 0 = this week, -1 = last week …
    func volume(weekOffset offset: Int) -> Double {
        guard let interval = weekInterval(offset: offset) else { return 0 }
        return entries
            .filter { $0.date >= interval.start && $0.date < interval.end }
            .reduce(0) { $0 + $1.volume }
    }

    func trainingDays(weekOffset offset: Int) -> Int {
        guard let interval = weekInterval(offset: offset) else { return 0 }
        return Set(entries
            .filter { $0.date >= interval.start && $0.date < interval.end }
            .map { cal.startOfDay(for: $0.date) }).count
    }

    /// Consecutive weeks with at least one workout. The current week only
    /// counts once it has a workout, so an empty Monday doesn't break a streak.
    var weekStreak: Int {
        let weekStarts = Set(entries.compactMap { cal.dateInterval(of: .weekOfYear, for: $0.date)?.start })
        guard !weekStarts.isEmpty, var cursor = cal.dateInterval(of: .weekOfYear, for: Date())?.start else { return 0 }
        if !weekStarts.contains(cursor), let previous = cal.date(byAdding: .weekOfYear, value: -1, to: cursor) {
            cursor = previous
        }
        var streak = 0
        while weekStarts.contains(cursor) {
            streak += 1
            guard let previous = cal.date(byAdding: .weekOfYear, value: -1, to: cursor) else { break }
            cursor = previous
        }
        return streak
    }
}
