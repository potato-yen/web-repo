document.addEventListener('DOMContentLoaded', () => {
    // 1. Scroll Reveal & Counter Animation
    const reveals = document.querySelectorAll('.reveal');
    
    // 用來檢查計數器是否已經跑過，避免重複觸發
    let hasCounted = false;

    const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        const elementVisible = 80;

        reveals.forEach((reveal) => {
            const elementTop = reveal.getBoundingClientRect().top;
            if (elementTop < windowHeight - elementVisible) {
                reveal.classList.add('active');

                // 如果這個區塊包含計數器，且還沒跑過動畫
                if (reveal.querySelector('.counter') && !hasCounted) {
                    initCounters();
                    hasCounted = true;
                }
            }
        });
    };

    // 數字跳動動畫函式
    const initCounters = () => {
        const counters = document.querySelectorAll('.counter');
        const speed = 1000; // 動畫總時間 (毫秒)

        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target'); // 取得目標數字
            const increment = target / (speed / 16); // 計算每次增加的量 (60FPS)
            
            const updateCount = () => {
                const count = +counter.innerText;
                if (count < target) {
                    // 無條件進位，讓數字看起來在跳動
                    counter.innerText = Math.ceil(count + increment);
                    setTimeout(updateCount, 16); // 約 60FPS
                } else {
                    counter.innerText = target; // 確保最後停在準確的目標值
                }
            };
            updateCount();
        });
    };

    // 監聽滾動事件
    window.addEventListener('scroll', revealOnScroll);
    // 初始執行
    revealOnScroll();

    // 2. Smooth Scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});