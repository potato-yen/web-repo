document.addEventListener('DOMContentLoaded', () => {
    const cards = Array.from(document.querySelectorAll('.card'));
    const navLinks = document.querySelectorAll('.nav-links a');
    const logoLink = document.querySelector('.logo');
    const cardStack = document.getElementById('card-stack');
    
    let currentIndex = 0;
    let isAnimating = false;
    const totalCards = cards.length;

    // ---------------------------------------------------------
    // 1. 核心：更新卡片狀態 (堆疊效果)
    // ---------------------------------------------------------
    function updateCards() {
        cards.forEach((card, index) => {
            card.classList.remove('active', 'prev', 'next');
            
            // 清除手動設定的樣式 (為了堆疊效果)
            card.style.transform = '';
            card.style.opacity = '';
            card.style.zIndex = '';

            if (index === currentIndex) {
                // 當前卡片
                card.classList.add('active');
                card.style.zIndex = 10;
            } else if (index < currentIndex) {
                // 已經過的卡片 (往上飛)
                card.classList.add('prev');
                card.style.zIndex = 10 + (index - currentIndex); // 確保層級順序
            } else {
                // 尚未到的卡片 (堆疊在下方)
                card.classList.add('next');
                
                // 計算堆疊偏移量 (Stacking Effect)
                const offsetIndex = index - currentIndex;
                const scale = 1 - (offsetIndex * 0.05); // 每一層縮小 5%
                const translateY = offsetIndex * 20;    // 每一層往下移 20px (加上 CSS 的 translate 會有右下延伸感)
                const translateX = offsetIndex * 0;     // 如果想要明顯往右，可以設為 20 (目前主要靠 CSS)
                
                // 限制最多顯示 3 層堆疊，避免效能浪費
                if (offsetIndex <= 3) {
                    card.style.zIndex = 10 - offsetIndex;
                    // 覆蓋 CSS 的預設 transform，這裡用 JS 精準控制
                    card.style.transform = `translate(${offsetIndex * 20}px, ${offsetIndex * 20}px) scale(${scale})`;
                    card.style.opacity = 1 - (offsetIndex * 0.2); // 越下面越透明
                } else {
                    card.style.opacity = 0; // 太深層的隱藏
                    card.style.zIndex = 0;
                }
            }
        });

        // 更新導覽列狀態
        updateNavigation();
        
        // 觸發當前卡片的 Scroll Reveal 檢查 (因為切換卡片後視窗內容變了)
        triggerRevealCheck(cards[currentIndex]);
    }

    function updateNavigation() {
        const currentId = cards[currentIndex].id;
        navLinks.forEach(link => {
            if (link.getAttribute('data-target') === currentId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    function goToCard(index) {
        if (index < 0 || index >= totalCards || isAnimating) return;
        if (index === currentIndex) return;

        isAnimating = true;
        currentIndex = index;
        updateCards();

        // 動畫冷卻時間，避免快速連續切換
        setTimeout(() => {
            isAnimating = false;
        }, 800);
    }

    // ---------------------------------------------------------
    // 2. 滾動邏輯 (混合模式：內部捲動 + 卡片切換)
    // ---------------------------------------------------------
    let scrollTimeout;

    function handleScroll(event) {
        // 阻擋預設行為並非總是必要，但在這裡可以防止瀏覽器彈性捲動干擾
        // event.preventDefault(); // 視情況開啟，可能會影響觸控板慣性

        if (isAnimating) return;

        const currentCard = cards[currentIndex];
        const inner = currentCard.querySelector('.card-inner');
        const delta = event.deltaY;

        // 判斷是否捲動到底部或頂部
        const isAtTop = inner.scrollTop <= 0;
        const isAtBottom = Math.ceil(inner.scrollTop + inner.clientHeight) >= inner.scrollHeight;

        // 邏輯判斷
        if (delta > 0 && isAtBottom) {
            // 往下捲 + 到底 = 下一張
            if (currentIndex < totalCards - 1) {
                goToCard(currentIndex + 1);
            }
        } else if (delta < 0 && isAtTop) {
            // 往上捲 + 到頂 = 上一張
            if (currentIndex > 0) {
                goToCard(currentIndex - 1);
            }
        }
        // 其他情況：讓瀏覽器處理 .card-inner 的原生捲動
    }

    // 監聽滾輪 (Debounce 處理)
    window.addEventListener('wheel', (e) => {
        // 這裡不直接防抖，因為要讓內部捲動順暢
        // 但我們要在「切換卡片」的瞬間鎖定
        handleScroll(e);
    }, { passive: true });


    // ---------------------------------------------------------
    // 3. 觸控支援 (Mobile Swipe)
    // ---------------------------------------------------------
    let touchStartY = 0;
    
    window.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
        if (isAnimating) return;
        
        const touchEndY = e.changedTouches[0].clientY;
        const deltaY = touchStartY - touchEndY;
        const threshold = 50; // 滑動門檻

        const currentCard = cards[currentIndex];
        const inner = currentCard.querySelector('.card-inner');
        const isAtTop = inner.scrollTop <= 0;
        const isAtBottom = Math.ceil(inner.scrollTop + inner.clientHeight) >= inner.scrollHeight;

        if (Math.abs(deltaY) > threshold) {
            if (deltaY > 0 && isAtBottom) {
                // 向上滑 (手指往上，內容往下) -> 下一張
                if (currentIndex < totalCards - 1) goToCard(currentIndex + 1);
            } else if (deltaY < 0 && isAtTop) {
                // 向下滑 -> 上一張
                if (currentIndex > 0) goToCard(currentIndex - 1);
            }
        }
    }, { passive: true });


    // ---------------------------------------------------------
    // 4. 導覽點擊事件
    // ---------------------------------------------------------
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            const targetIndex = cards.findIndex(card => card.id === targetId);
            if (targetIndex !== -1) {
                goToCard(targetIndex);
            }
        });
    });

    if (logoLink) {
        logoLink.addEventListener('click', (e) => {
            e.preventDefault();
            goToCard(0); // 回首頁
        });
    }


    // ---------------------------------------------------------
    // 5. Scroll Reveal & Counter Animation (針對 .card-inner)
    // ---------------------------------------------------------
    
    // 為每一個 card-inner 綁定 scroll 事件
    const cardInners = document.querySelectorAll('.card-inner');
    let hasCounted = false; // LeetCode 計數器鎖

    function checkReveal(container) {
        const reveals = container.querySelectorAll('.reveal');
        const windowHeight = window.innerHeight;
        const elementVisible = 100;

        reveals.forEach((reveal) => {
            const elementTop = reveal.getBoundingClientRect().top;
            
            // 只要元素進入視窗 (無論在哪個容器內)
            if (elementTop < windowHeight - elementVisible) {
                reveal.classList.add('active');

                // 觸發計數器動畫 (如果還沒跑過)
                if (reveal.querySelector('.counter') && !hasCounted) {
                    // 稍微延遲一下，等卡片轉場穩定了再跑數字
                    setTimeout(initCounters, 500);
                    hasCounted = true;
                }
            }
        });
    }

    function triggerRevealCheck(activeCard) {
        if (!activeCard) return;
        const inner = activeCard.querySelector('.card-inner');
        if (inner) checkReveal(inner);
    }

    cardInners.forEach(inner => {
        inner.addEventListener('scroll', () => {
            checkReveal(inner);
        });
    });

    // LeetCode 計數器邏輯 (維持不變)
    const initCounters = () => {
        const counters = document.querySelectorAll('.counter');
        const speed = 1500; 

        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const increment = target / (speed / 16);
            
            let current = 0;
            const updateCount = () => {
                current += increment;
                if (current < target) {
                    counter.innerText = Math.ceil(current);
                    setTimeout(updateCount, 16);
                } else {
                    counter.innerText = target;
                }
            };
            updateCount();
        });
    };

    // ---------------------------------------------------------
    // Init
    // ---------------------------------------------------------
    updateCards(); // 初始化第一張卡片
});