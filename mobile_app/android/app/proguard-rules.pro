# Flutter wrapper
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.**  { *; }
-keep class io.flutter.util.**  { *; }
-keep class io.flutter.view.**  { *; }
-keep class io.flutter.**  { *; }
-keep class io.flutter.plugins.**  { *; }
-keep class io.flutter.embedding.** { *; }

# Keep Flutter Secure Storage
-keep class com.it_nomads.fluttersecurestorage.** { *; }

# Keep annotations
-keepattributes *Annotation*

# Prevent obfuscation of types which use ButterKnife annotations
-dontwarn butterknife.internal.**

# Google Play Core - ignorer les wrarnings
-dontwarn com.google.android.play.core.**
-keep class com.google.android.play.core.** { *; }

# Missing classes
-dontwarn com.google.android.play.core.splitinstall.**
-dontwarn com.google.android.play.core.tasks.**
