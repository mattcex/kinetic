import SwiftUI

/// Pure black canvas with slowly drifting, heavily blurred light orbs.
struct AmbientBackground: View {
    var intensity: Double = 1
    @State private var drift = false

    var body: some View {
        ZStack {
            Color.black

            Circle()
                .fill(Theme.accent.opacity(0.30 * intensity))
                .frame(width: 420, height: 420)
                .blur(radius: 120)
                .offset(x: drift ? 130 : -140, y: drift ? -330 : -230)

            Circle()
                .fill(Theme.mint.opacity(0.16 * intensity))
                .frame(width: 360, height: 360)
                .blur(radius: 110)
                .offset(x: drift ? -150 : 140, y: drift ? 110 : 260)

            Circle()
                .fill(Theme.cyan.opacity(0.10 * intensity))
                .frame(width: 300, height: 300)
                .blur(radius: 100)
                .offset(x: drift ? 170 : -70, y: drift ? 430 : 340)

            RadialGradient(
                colors: [Color.clear, Color.black.opacity(0.65)],
                center: .center,
                startRadius: 180,
                endRadius: 620
            )
        }
        .ignoresSafeArea()
        .allowsHitTesting(false)
        .onAppear {
            withAnimation(.easeInOut(duration: 14).repeatForever(autoreverses: true)) {
                drift = true
            }
        }
    }
}
