/**
 * 侘びの環境音 ─ Web Audio API
 * 風のささやき、水滴、ししおどしを生成
 */
class WabiAmbient {
    constructor() {
        this.ctx = null;
        this.isPlaying = false;
        this.masterGain = null;
        this.nodes = [];
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0;
        this.masterGain.connect(this.ctx.destination);
    }

    // 風のささやき ─ 柔らかいフィルタリングノイズ
    createWind() {
        const bufferSize = this.ctx.sampleRate * 6;
        const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);

        for (let ch = 0; ch < 2; ch++) {
            const data = buffer.getChannelData(ch);
            let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                // ブラウンノイズ風（より自然な風の音）
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.025;
                b6 = white * 0.115926;
            }
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        // ローパスフィルタで柔らかく
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600;
        filter.Q.value = 0.7;

        const windGain = this.ctx.createGain();
        windGain.gain.value = 0.8;

        // LFOでゆったりうねり
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.value = 0.05;
        lfoGain.gain.value = 0.3;
        lfo.connect(lfoGain);
        lfoGain.connect(windGain.gain);
        lfo.start();

        source.connect(filter);
        filter.connect(windGain);
        windGain.connect(this.masterGain);
        source.start();

        this.nodes.push(source, lfo);
    }

    // 水滴 ─ 蹲踞の水音（柔らかく丸い音）
    createWaterDrop() {
        const drop = () => {
            if (!this.isPlaying) return;

            const now = this.ctx.currentTime;

            // メインの水滴音（低めで丸い）
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            const baseFreq = 400 + Math.random() * 300;
            osc.frequency.setValueAtTime(baseFreq, now);
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.15, now + 0.5);
            osc.type = 'sine';

            const vol = 0.04 + Math.random() * 0.03;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(vol, now + 0.005);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

            // ローパスで丸くする
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 1200;

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now);
            osc.stop(now + 0.7);

            // 次の水滴（不規則な間隔、もっと間を空ける）
            const nextDrop = 4000 + Math.random() * 10000;
            setTimeout(drop, nextDrop);
        };

        setTimeout(drop, 3000 + Math.random() * 5000);
    }

    // ししおどし ─ 竹が石を打つ「コーン」という音
    createShishiodoshi() {
        const knock = () => {
            if (!this.isPlaying) return;

            const now = this.ctx.currentTime;

            // 竹が石を打つ「コーン」音 ─ 2つのオシレーターで構成
            // 1. アタック（高い衝撃音）
            const attack = this.ctx.createOscillator();
            const attackGain = this.ctx.createGain();
            attack.frequency.setValueAtTime(800, now);
            attack.frequency.exponentialRampToValueAtTime(200, now + 0.08);
            attack.type = 'triangle';
            attackGain.gain.setValueAtTime(0.25, now);
            attackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            attack.connect(attackGain);
            attackGain.connect(this.masterGain);
            attack.start(now);
            attack.stop(now + 0.15);

            // 2. 残響（低い木の響き）
            const body = this.ctx.createOscillator();
            const bodyGain = this.ctx.createGain();
            body.frequency.setValueAtTime(180, now + 0.01);
            body.frequency.exponentialRampToValueAtTime(80, now + 0.5);
            body.type = 'sine';
            bodyGain.gain.setValueAtTime(0.18, now + 0.01);
            bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

            const bodyFilter = this.ctx.createBiquadFilter();
            bodyFilter.type = 'lowpass';
            bodyFilter.frequency.value = 400;

            body.connect(bodyFilter);
            bodyFilter.connect(bodyGain);
            bodyGain.connect(this.masterGain);
            body.start(now + 0.01);
            body.stop(now + 1.0);

            // 3. ノイズ成分（衝撃のバリバリ感）
            const noiseLen = this.ctx.sampleRate * 0.05;
            const noiseBuf = this.ctx.createBuffer(1, noiseLen, this.ctx.sampleRate);
            const noiseData = noiseBuf.getChannelData(0);
            for (let i = 0; i < noiseLen; i++) {
                noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (noiseLen * 0.2));
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = noiseBuf;
            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.08, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            const noiseFilter = this.ctx.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.value = 500;
            noiseFilter.Q.value = 2;
            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(this.masterGain);
            noise.start(now);

            // 次のししおどし（15〜35秒間隔）
            const nextKnock = 15000 + Math.random() * 20000;
            setTimeout(knock, nextKnock);
        };

        // 最初は8秒後
        setTimeout(knock, 8000);
    }

    start() {
        this.init();
        if (this.isPlaying) return;
        this.isPlaying = true;

        // フェードイン（3秒かけてゆっくり）
        this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.masterGain.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + 3);

        this.createWind();
        this.createWaterDrop();
        this.createShishiodoshi();
    }

    stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;

        // フェードアウト
        if (this.masterGain) {
            this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 2);
        }

        setTimeout(() => {
            this.nodes.forEach(node => {
                try { node.stop(); } catch (e) { }
            });
            this.nodes = [];
            if (this.ctx) {
                this.ctx.close();
                this.ctx = null;
            }
        }, 2500);
    }

    toggle() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.start();
        }
        return this.isPlaying;
    }
}

// グローバルインスタンス
const wabiAmbient = new WabiAmbient();
