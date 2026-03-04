/**
 * 侘びの環境音 ─ Web Audio API
 * 風のささやき、水滴、小鳥のさえずりを生成
 */
class WabiAmbient {
    constructor() {
        this.ctx = null;
        this.isPlaying = false;
        this.masterGain = null;
        this.nodes = [];
        this.timers = []; // setTimeoutのIDを追跡
    }

    init() {
        if (this.ctx && this.ctx.state !== 'closed') return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0;
        this.masterGain.connect(this.ctx.destination);
    }

    // タイマーを安全に登録
    _setTimeout(fn, delay) {
        const id = setTimeout(fn, delay);
        this.timers.push(id);
        return id;
    }

    // 全タイマーをクリア
    _clearAllTimers() {
        this.timers.forEach(id => clearTimeout(id));
        this.timers = [];
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
            if (!this.isPlaying || !this.ctx || this.ctx.state === 'closed') return;

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
            this._setTimeout(drop, nextDrop);
        };

        this._setTimeout(drop, 3000 + Math.random() * 5000);
    }

    // 小鳥のさえずり ─ 高い周波数で短い音符を連続
    createBirdChirp() {
        const chirp = () => {
            if (!this.isPlaying || !this.ctx || this.ctx.state === 'closed') return;

            const now = this.ctx.currentTime;

            // 1回のさえずり = 2〜5回の短い音符の連続
            const noteCount = 2 + Math.floor(Math.random() * 4);
            const baseFreq = 2000 + Math.random() * 2000; // 2000〜4000Hz

            for (let i = 0; i < noteCount; i++) {
                const noteTime = now + i * (0.06 + Math.random() * 0.08);
                const freq = baseFreq + (Math.random() - 0.5) * 800;

                // メインのさえずり音
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, noteTime);
                // 上がる鳴き声、または下がる鳴き声
                const freqEnd = freq + (Math.random() > 0.5 ? 1 : -1) * (200 + Math.random() * 600);
                osc.frequency.exponentialRampToValueAtTime(
                    Math.max(freqEnd, 500), noteTime + 0.05 + Math.random() * 0.04
                );

                const vol = 0.015 + Math.random() * 0.01;
                gain.gain.setValueAtTime(0, noteTime);
                gain.gain.linearRampToValueAtTime(vol, noteTime + 0.005);
                gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.08 + Math.random() * 0.04);

                // 倍音を加えてリアルに
                const osc2 = this.ctx.createOscillator();
                const gain2 = this.ctx.createGain();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(freq * 2, noteTime);
                osc2.frequency.exponentialRampToValueAtTime(
                    Math.max(freqEnd * 2, 1000), noteTime + 0.05 + Math.random() * 0.04
                );
                gain2.gain.setValueAtTime(0, noteTime);
                gain2.gain.linearRampToValueAtTime(vol * 0.3, noteTime + 0.005);
                gain2.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.06);

                // バンドパスフィルタで自然な鳥の声に
                const filter = this.ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.value = freq;
                filter.Q.value = 5;

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.masterGain);
                osc.start(noteTime);
                osc.stop(noteTime + 0.15);

                osc2.connect(gain2);
                gain2.connect(this.masterGain);
                osc2.start(noteTime);
                osc2.stop(noteTime + 0.12);
            }

            // 次のさえずり（5〜20秒間隔 ─ 静けさを大切に）
            const nextChirp = 5000 + Math.random() * 15000;
            this._setTimeout(chirp, nextChirp);
        };

        // 最初は4秒後
        this._setTimeout(chirp, 4000 + Math.random() * 3000);
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
        this.createBirdChirp();
    }

    stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;

        // 全タイマーを即座にクリア（新しい音のスケジューリングを停止）
        this._clearAllTimers();

        // フェードアウト
        if (this.masterGain && this.ctx && this.ctx.state !== 'closed') {
            const now = this.ctx.currentTime;
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
            this.masterGain.gain.linearRampToValueAtTime(0, now + 1.5);
        }

        // フェードアウト完了後にクリーンアップ
        setTimeout(() => {
            this.nodes.forEach(node => {
                try { node.stop(); } catch (e) { }
            });
            this.nodes = [];
            if (this.ctx && this.ctx.state !== 'closed') {
                this.ctx.close().catch(() => {});
                this.ctx = null;
                this.masterGain = null;
            }
        }, 2000);
    }

    toggle() {
        if (this.isPlaying) {
            this.stop();
            return false;
        } else {
            this.start();
            return true;
        }
    }
}

// グローバルインスタンス
const wabiAmbient = new WabiAmbient();
