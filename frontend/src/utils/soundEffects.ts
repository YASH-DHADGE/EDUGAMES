// Sound effects temporarily disabled due to expo-av deprecation
// TODO: Migrate to expo-audio when stable

class SoundManager {
    private isEnabled: boolean = true;
    private isInitialized: boolean = false;

    private isMutedState: boolean = false;

    async initialize() {
        this.isInitialized = true;
        console.log('Sound Manager initialized');
    }

    async playCorrect() {
        if (this.isMutedState) return;
        // No-op
    }

    async playWrong() {
        if (this.isMutedState) return;
        // No-op
    }

    async playClick() {
        if (this.isMutedState) return;
        // No-op
    }

    async playSuccess() {
        if (this.isMutedState) return;
        // No-op
    }

    setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
    }

    getEnabled(): boolean {
        return this.isEnabled;
    }

    mute() {
        this.isMutedState = true;
    }

    unmute() {
        this.isMutedState = false;
    }

    get isMuted(): boolean {
        return this.isMutedState;
    }

    async cleanup() {
        this.isInitialized = false;
    }
}

export const soundManager = new SoundManager();
