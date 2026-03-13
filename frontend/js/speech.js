class SpeechRecognizer {
    constructor(onResult, onStart, onEnd, onError) {
        this.onResult = onResult;
        this.onStart = onStart;
        this.onEnd = onEnd;
        this.onError = onError;
        
        this.recognition = null;
        this.isSupported = false;
        this.isContinuous = false;
        
        this.init();
    }

    init() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            this.isSupported = false;
            return;
        }

        this.isSupported = true;
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'es-PE';
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;

        this.recognition.onresult = (event) => {
            if (window.jarvisSocket && window.jarvisSocket.isPlaying) return;
            if (window.jarvisSocket && (window.jarvisSocket.isPlaying || window.jarvisSocket.isCoolingDown)) return;
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    if (this.onResult) {
                        this.onResult(transcript);
                    }
                }
            }
        };

        this.recognition.onstart = () => {
            if (this.onStart) {
                this.onStart();
            }
        };

        this.recognition.onspeechstart = () => {
            if (window.jarvisSocket && window.jarvisSocket.isPlaying) {
                this.recognition.abort();
                return;
            }

            if (window.jarvisSocket && (window.jarvisSocket.isPlaying || window.jarvisSocket.isCoolingDown)) {
                this.recognition.abort();
                return;
            }
        };

        this.recognition.onend = () => {
            if (this.isContinuous && this.isSupported) {
                // ← NUEVO: también chequear isCoolingDown
                if (window.jarvisSocket && 
                    (window.jarvisSocket.isPlaying || window.jarvisSocket.isCoolingDown)) {
                    // Esperar a que el cooldown termine antes de reintentar
                    setTimeout(() => {
                        if (this.isContinuous && 
                            !window.jarvisSocket?.isPlaying && 
                            !window.jarvisSocket?.isCoolingDown) {
                            try { this.recognition.start(); } catch(e) {}
                        }
                    }, 600);
                    return;
                }
                try {
                    this.recognition.start();
                } catch (e) {
                    if (this.onEnd) this.onEnd();
                }
            } else {
                if (this.onEnd) this.onEnd();
            }
        };

        this.recognition.onerror = (event) => {
            if (event.error === 'no-speech' && this.isContinuous) {
                return;
            }
            if (this.onError) {
                this.onError(event.error);
            }
        };
    }

    start() {
        if (!this.isSupported) {
            if (this.onError) {
                this.onError('not-supported');
            }
            return false;
        }
        
        try {
            this.recognition.start();
            return true;
        } catch (e) {
            return false;
        }
    }

    startContinuous() {
        if (!this.isSupported) {
            if (this.onError) {
                this.onError('not-supported');
            }
            return false;
        }

        this.isContinuous = true;
        this.recognition.continuous = true;
        
        try {
            if (this.recognition.running) {
                return true;
            }
            this.recognition.start();
            return true;
        } catch (e) {
            return false;
        }
    }

    stop() {
        this.isContinuous = false;
        this.recognition.continuous = false;
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (e) {
            }
        }
    }

    isAvailable() {
        return this.isSupported;
    }

    setLanguage(lang) {
        if (this.recognition) {
            this.recognition.lang = lang;
        }
    }
}
