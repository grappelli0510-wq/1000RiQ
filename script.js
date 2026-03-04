/* ============================================
   千利休 ─ 侘びの極致を求めた茶聖
   ウェブブック インタラクション
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // --- 要素取得 ---
    const loadingScreen = document.getElementById('loading-screen');
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('#nav-menu a');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const progressFill = document.getElementById('progress-fill');
    const pages = document.querySelectorAll('.page');
    const book = document.getElementById('book');

    // --- 読み込み画面制御 ---
    function hideLoading() {
        loadingScreen.classList.add('hidden');
        document.body.style.overflow = '';
    }

    // ページ完全読み込み後にフェードアウト
    document.body.style.overflow = 'hidden';
    window.addEventListener('load', () => {
        setTimeout(hideLoading, 1500);
    });

    // フォールバック：5秒で強制非表示
    setTimeout(hideLoading, 5000);

    // --- ナビゲーション ---
    navToggle.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle('open');
        navToggle.classList.toggle('active', isOpen);
    });

    // メニュー外クリックで閉じる
    document.addEventListener('click', (e) => {
        if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
            navMenu.classList.remove('open');
            navToggle.classList.remove('active');
        }
    });

    // ナビリンククリック
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const target = document.getElementById(targetId);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                navMenu.classList.remove('open');
                navToggle.classList.remove('active');
            }
        });
    });

    // --- スクロール監視 ---
    let currentPage = 0;
    const totalPages = pages.length;

    function updateOnScroll() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;

        // 進捗バー更新
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        progressFill.style.width = progress + '%';

        // 現在のページ特定
        let newCurrentPage = 0;
        pages.forEach((page, index) => {
            const rect = page.getBoundingClientRect();
            if (rect.top <= window.innerHeight / 3) {
                newCurrentPage = index;
            }
        });

        if (newCurrentPage !== currentPage) {
            currentPage = newCurrentPage;
            updateNavHighlight();
        }

        // ページ送りボタンの表示制御
        prevBtn.classList.toggle('visible', currentPage > 0);
        nextBtn.classList.toggle('visible', currentPage < totalPages - 1);
    }

    function updateNavHighlight() {
        navLinks.forEach(link => {
            const chapterIndex = parseInt(link.getAttribute('data-chapter'));
            const pageChapter = parseInt(pages[currentPage]?.getAttribute('data-chapter'));
            link.classList.toggle('active', chapterIndex === pageChapter);
        });
    }

    // スクロールイベント（パフォーマンス最適化）
    let scrollTicking = false;
    window.addEventListener('scroll', () => {
        if (!scrollTicking) {
            requestAnimationFrame(() => {
                updateOnScroll();
                scrollTicking = false;
            });
            scrollTicking = true;
        }
    });

    // --- ページ送りボタン ---
    prevBtn.addEventListener('click', () => {
        if (currentPage > 0) {
            pages[currentPage - 1].scrollIntoView({ behavior: 'smooth' });
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages - 1) {
            pages[currentPage + 1].scrollIntoView({ behavior: 'smooth' });
        }
    });

    // キーボードナビゲーション
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (currentPage > 0) {
                pages[currentPage - 1].scrollIntoView({ behavior: 'smooth' });
            }
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            if (currentPage < totalPages - 1) {
                pages[currentPage + 1].scrollIntoView({ behavior: 'smooth' });
            }
        } else if (e.key === 'Escape') {
            navMenu.classList.remove('open');
            navToggle.classList.remove('active');
        }
    });

    // --- スクロールアニメーション（IntersectionObserver） ---
    function setupScrollAnimations() {
        // アニメーション対象の要素にクラスを追加
        const animTargets = document.querySelectorAll(
            '.chapter-header, .image-block, .text-block > p, .text-block > h3, ' +
            '.philosophy-grid, .rikyu-quote, .colophon-border'
        );

        animTargets.forEach((el, i) => {
            el.classList.add('fade-in-up');
            // 次の要素に少しずつ遅延
            const delayClass = (i % 3) + 1;
            if (delayClass <= 3) {
                el.classList.add('delay-' + delayClass);
            }
        });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        animTargets.forEach(el => observer.observe(el));
    }

    setupScrollAnimations();

    // --- 画像の遅延読み込みとフェードイン ---
    const images = document.querySelectorAll('.chapter-image, .cover-image');
    images.forEach(img => {
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.8s ease';

        if (img.complete) {
            img.style.opacity = '1';
        } else {
            img.addEventListener('load', () => {
                img.style.opacity = '1';
            });
        }
    });

    // --- 表紙パララックス効果 ---
    const coverPage = document.querySelector('.cover-page');
    const coverContent = document.querySelector('.cover-content');

    function updateParallax() {
        if (!coverPage || !coverContent) return;
        const scrollTop = window.scrollY;
        const coverHeight = coverPage.offsetHeight;

        if (scrollTop < coverHeight) {
            const progress = scrollTop / coverHeight;
            coverContent.style.transform = `translateY(${scrollTop * 0.3}px)`;
            coverContent.style.opacity = 1 - progress * 1.2;
        }
    }

    window.addEventListener('scroll', () => {
        requestAnimationFrame(updateParallax);
    });

    // --- 初期状態設定 ---
    updateOnScroll();

});
