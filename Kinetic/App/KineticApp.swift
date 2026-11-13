import SwiftUI

@main
struct KineticApp: App {
    @StateObject private var store = Store()

    var body: some Scene {
        WindowGroup {
            NavigationStack {
                DashboardView()
                    .navigationDestination(for: UUID.self) { id in
                        ExerciseDetailView(exerciseID: id)
                    }
            }
            .environmentObject(store)
            .environment(\.locale, Locale(identifier: "pl_PL"))
            .preferredColorScheme(.dark)
            .tint(Theme.accent)
        }
    }
}
