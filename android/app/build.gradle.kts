plugins {
    id("com.android.application")
}

android {
    namespace = "app.kinetic.strength"
    compileSdk = 35

    defaultConfig {
        applicationId = "app.kinetic.strength"
        minSdk = 24
        targetSdk = 35
        // CI passes the workflow run number so every build installs as an update.
        versionCode = (System.getenv("VERSION_CODE") ?: "1").toInt()
        versionName = "1.0"
    }

    signingConfigs {
        // Sideload key committed in the repository so updates install over earlier builds.
        // Set the KINETIC_* environment variables to sign with a private key instead.
        create("kinetic") {
            storeFile = file(System.getenv("KINETIC_KEYSTORE_FILE") ?: "../signing/kinetic-sideload.p12")
            storePassword = System.getenv("KINETIC_KEYSTORE_PASSWORD") ?: "kinetic-sideload"
            keyAlias = System.getenv("KINETIC_KEY_ALIAS") ?: "kinetic"
            keyPassword = System.getenv("KINETIC_KEY_PASSWORD") ?: "kinetic-sideload"
            storeType = "pkcs12"
        }
    }

    buildTypes {
        getByName("debug") {
            signingConfig = signingConfigs.getByName("kinetic")
        }
        getByName("release") {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("kinetic")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    sourceSets {
        getByName("main") {
            // The web app in /docs is the single source of the UI; it is bundled as APK assets.
            assets.srcDirs("../../docs")
        }
    }
}

dependencies {
    implementation("androidx.activity:activity:1.9.3")
    implementation("androidx.core:core:1.13.1")
    implementation("androidx.webkit:webkit:1.12.1")
}
