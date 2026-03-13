class JarvisSocket {
    constructor(backendUrl, onTranscript, onSentenceStart, onResponseComplete, onIdle, onConnect, onDisconnect) {
        this.backendUrl = backendUrl;
        this.onTranscript = onTranscript;
        this.onSentenceStart = onSentenceStart;
        this.onResponseComplete = onResponseComplete;
        this.onIdle = onIdle;
        this.onConnect = onConnect;
        this.onDisconnect = onDisconnect;
        this.onSpeakingStart = null;
        this.isCoolingDown = false;
        
        this.audioQueue = [];
        this.isPlaying = false;
        this.audioContext = null;
        this.analyser = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        this.connect();
    }

    connect() {
        this.ws = new WebSocket(this.backendUrl);

        this.ws.onopen = () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            if (this.onConnect) {
                this.onConnect();
            }
        };

        this.ws.onclose = () => {
            this.isConnected = false;
            if (this.onDisconnect) {
                this.onDisconnect();
            }
            this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.ws.onmessage = (event) => {
            this.handleMessage(event);
        };
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
                console.log(`Reconnecting... attempt ${this.reconnectAttempts}`);
                this.connect();
            }, 3000);
        }
    }

    initAudioContext() {
        if (this.audioContext) return;
        
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.connect(this.audioContext.destination);
    }

    async handleMessage(event) {
        if (event.data instanceof Blob) {
            const buffer = await event.data.arrayBuffer();
            this.audioQueue.push(buffer);
            if (!this.isPlaying) {
                this.playNext();
            }
        } else {
            try {
                const msg = JSON.parse(event.data);
                
                if (msg.type === 'sentence_start') {
                    if (this.onSentenceStart) {
                        this.onSentenceStart(msg.text);
                    }
                } else if (msg.type === 'response_complete') {
                    if (this.onResponseComplete) {
                        this.onResponseComplete();
                    }
                }
            } catch (e) {
                console.error('Error parsing message:', e);
            }
        }
    }

    async playNext() {
        if (this.audioQueue.length === 0) {
            this.isPlaying = false;
            this.isCoolingDown = true;
            if (this.onIdle) {
                this.onIdle();
            }
            setTimeout(() => {
                this.isCoolingDown = false;
            }, 2000);
            return;
        }

        this.isPlaying = true;

        if (this.onSpeakingStart) {
            this.onSpeakingStart();
        }

        this.initAudioContext();

        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        const buffer = this.audioQueue.shift();
        const audioBuffer = await this.audioContext.decodeAudioData(buffer);
        
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = 1.0;
        
        source.connect(gainNode);
        gainNode.connect(this.analyser);
        
        source.onended = () => {
            this.playNext();
        };
        
        source.start();
        this.animateReactor();
    }

    animateReactor() {
        if (!this.analyser) return;
        
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        
        const tick = () => {
            if (!this.isPlaying) {
                if (window.reactor) {
                    window.reactor.setAudioLevel(0);
                }
                return;
            }
            
            this.analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            const level = average / 255;
            
            if (window.reactor) {
                window.reactor.setAudioLevel(level);
            }
            
            requestAnimationFrame(tick);
        };
        
        requestAnimationFrame(tick);
    }

    send(text) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ text }));
        }
    }

    isOpen() {
        return this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN;
    }

    stopAudio() {
        this.audioQueue = [];
        this.isPlaying = false;
        if (window.reactor) {
            window.reactor.setAudioLevel(0);
        }
    }
}
