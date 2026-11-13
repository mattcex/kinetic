import SwiftUI

enum Theme {
    static let accent = Color(hex: 0x39D353)
    static let accentDeep = Color(hex: 0x26A641)
    static let mint = Color(hex: 0x2EE6A6)
    static let cyan = Color(hex: 0x3BC9DB)
    static let danger = Color(hex: 0xFF5C5C)

    static let textPrimary = Color.white
    static let textSecondary = Color.white.opacity(0.58)
    static let textTertiary = Color.white.opacity(0.34)

    /// GitHub-style contribution levels, from empty to most intense.
    static let heatLevels: [Color] = [
        Color.white.opacity(0.06),
        Color(hex: 0x0E4429),
        Color(hex: 0x006D32),
        Color(hex: 0x26A641),
        Color(hex: 0x39D353)
    ]

    static let accentGradient = LinearGradient(
        colors: [Theme.mint, Theme.accent],
        startPoint: .leading,
        endPoint: .trailing
    )
}

extension Color {
    init(hex: UInt32, opacity: Double = 1) {
        let r = Double((hex >> 16) & 0xFF) / 255
        let g = Double((hex >> 8) & 0xFF) / 255
        let b = Double(hex & 0xFF) / 255
        self.init(.sRGB, red: r, green: g, blue: b, opacity: opacity)
    }
}

extension Calendar {
    /// Gregorian calendar with Monday as the first day of the week.
    static let kinetic: Calendar = {
        var calendar = Calendar(identifier: .gregorian)
        calendar.firstWeekday = 2
        calendar.minimumDaysInFirstWeek = 4
        calendar.locale = Locale(identifier: "pl_PL")
        calendar.timeZone = TimeZone.current
        return calendar
    }()
}

// MARK: - Glass card

struct GlassCard: ViewModifier {
    var padding: CGFloat
    var cornerRadius: CGFloat

    func body(content: Content) -> some View {
        content
            .padding(padding)
            .background(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [Color.white.opacity(0.075), Color.white.opacity(0.022)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
            )
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .strokeBorder(
                        LinearGradient(
                            colors: [Color.white.opacity(0.16), Color.white.opacity(0.03)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 1
                    )
            )
    }
}

extension View {
    func glassCard(padding: CGFloat = 20, cornerRadius: CGFloat = 26) -> some View {
        modifier(GlassCard(padding: padding, cornerRadius: cornerRadius))
    }

    func fadeUp(_ delay: Double = 0) -> some View {
        modifier(FadeUp(delay: delay))
    }
}

// MARK: - Entrance animation

struct FadeUp: ViewModifier {
    let delay: Double
    @State private var shown = false

    func body(content: Content) -> some View {
        content
            .opacity(shown ? 1 : 0)
            .offset(y: shown ? 0 : 18)
            .blur(radius: shown ? 0 : 6)
            .onAppear {
                withAnimation(.spring(response: 0.7, dampingFraction: 0.86).delay(delay)) {
                    shown = true
                }
            }
    }
}

// MARK: - Button style

struct PressableStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.96 : 1)
            .opacity(configuration.isPressed ? 0.85 : 1)
            .animation(.spring(response: 0.3, dampingFraction: 0.7), value: configuration.isPressed)
    }
}

// MARK: - Small label

struct Eyebrow: View {
    let text: String
    var color: Color = Theme.textTertiary

    init(_ text: String, color: Color = Theme.textTertiary) {
        self.text = text
        self.color = color
    }

    var body: some View {
        Text(text.uppercased())
            .font(.system(size: 11, weight: .semibold))
            .tracking(1.6)
            .foregroundStyle(color)
    }
}
