import Foundation

/// Deterministic half-year training log so the charts and heatmap have something to show.
enum DemoData {
    private struct Lift {
        let exercise: Exercise
        let base: Double
        let gain: Double
        let reps: ClosedRange<Int>
    }

    static func make() -> (exercises: [Exercise], entries: [LogEntry]) {
        var rng = SeededGenerator(seed: 2026)
        let cal = Calendar.kinetic
        let today = cal.startOfDay(for: Date())
        let totalDays = 182

        let bench = Lift(exercise: Exercise(name: "Wyciskanie leżąc", group: .chest), base: 70, gain: 22.5, reps: 3...8)
        let squat = Lift(exercise: Exercise(name: "Przysiad", group: .legs), base: 90, gain: 35, reps: 3...8)
        let deadlift = Lift(exercise: Exercise(name: "Martwy ciąg", group: .back), base: 110, gain: 40, reps: 2...6)
        let ohp = Lift(exercise: Exercise(name: "Wyciskanie nad głowę", group: .shoulders), base: 40, gain: 12.5, reps: 4...8)
        let pullup = Lift(exercise: Exercise(name: "Podciąganie z obciążeniem", group: .back), base: 5, gain: 15, reps: 4...8)
        let curl = Lift(exercise: Exercise(name: "Uginanie ze sztangą", group: .arms), base: 25, gain: 10, reps: 8...12)

        let lifts = [bench, squat, deadlift, ohp, pullup, curl]
        let rotation: [[Lift]] = [
            [bench, ohp, curl],
            [squat, deadlift],
            [bench, squat, pullup],
            [deadlift, ohp, pullup, curl]
        ]
        let skippedWeeks: Set<Int> = [7, 16]

        var entries: [LogEntry] = []
        var sessionIndex = 0

        for dayOffset in stride(from: totalDays, through: 0, by: -1) {
            guard let day = cal.date(byAdding: .day, value: -dayOffset, to: today) else { continue }
            let weekIndex = (totalDays - dayOffset) / 7
            if skippedWeeks.contains(weekIndex) { continue }

            let weekday = cal.component(.weekday, from: day) // 1 = Sunday … 7 = Saturday
            let isPlanned = weekday == 2 || weekday == 4 || weekday == 6
            let isBonus = weekday == 7 && Double.random(in: 0...1, using: &rng) < 0.35
            guard isPlanned || isBonus else { continue }
            if Double.random(in: 0...1, using: &rng) < 0.12 { continue }

            let progress = Double(totalDays - dayOffset) / Double(totalDays)
            let session = rotation[sessionIndex % rotation.count]
            sessionIndex += 1

            let hour = Int.random(in: 7...19, using: &rng)
            let time = cal.date(bySettingHour: hour, minute: Int.random(in: 0...59, using: &rng), second: 0, of: day) ?? day

            for lift in session {
                let noise = Double.random(in: -1...1, using: &rng) * 2.5
                let raw = lift.base + lift.gain * progress + noise
                let weight = max(2.5, (raw / 2.5).rounded() * 2.5)
                let reps = Int.random(in: lift.reps, using: &rng)
                let sets = Int.random(in: 3...5, using: &rng)
                entries.append(LogEntry(exerciseID: lift.exercise.id, date: time, weight: weight, reps: reps, sets: sets))
            }
        }

        var exercises: [Exercise] = []
        for (index, lift) in lifts.enumerated() {
            var exercise = lift.exercise
            exercise.createdAt = cal.date(byAdding: .day, value: -(totalDays + 1 + index), to: today) ?? today
            exercises.append(exercise)
        }
        return (exercises, entries)
    }
}

/// SplitMix64 – small, fast and deterministic.
struct SeededGenerator: RandomNumberGenerator {
    private var state: UInt64

    init(seed: UInt64) { state = seed }

    mutating func next() -> UInt64 {
        state &+= 0x9E3779B97F4A7C15
        var z = state
        z = (z ^ (z >> 30)) &* 0xBF58476D1CE4E5B9
        z = (z ^ (z >> 27)) &* 0x94D049BB133111EB
        return z ^ (z >> 31)
    }
}
