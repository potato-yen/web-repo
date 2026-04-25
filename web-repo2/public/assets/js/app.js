document.addEventListener('DOMContentLoaded', () => {
    // =========================================================
    // 1. Card Stack Logic (卡片堆疊與切換)
    // =========================================================
    const cards = Array.from(document.querySelectorAll('.card'));
    const navLinks = document.querySelectorAll('.nav-links a');
    const logoLink = document.querySelector('.logo');
    
    let currentIndex = 0;
    let isAnimating = false;
    const totalCards = cards.length;

    function updateCards() {
        cards.forEach((card, index) => {
            card.classList.remove('active', 'prev', 'next');
            
            // 重置樣式，以便重新計算
            card.style.transform = '';
            card.style.opacity = '';
            card.style.zIndex = '';
            card.style.pointerEvents = '';

            if (index === currentIndex) {
                // 當前卡片
                card.classList.add('active');
                card.style.zIndex = 10;
                card.style.pointerEvents = 'auto';
            } else if (index < currentIndex) {
                // 過去的卡片 (往上飛)
                card.classList.add('prev');
                card.style.zIndex = 10 + (index - currentIndex); 
            } else {
                // 未來的卡片 (堆疊在下方)
                card.classList.add('next');
                
                // 計算堆疊偏移 (3D 效果)
                const offset = index - currentIndex;
                const scale = 1 - (offset * 0.05); 
                const translateY = offset * 0; // 這裡設為 0，交給 CSS 的 transform，或者您也可以用 JS 控制
                
                // 限制堆疊層數，優化效能
                if (offset <= 3) {
                    card.style.zIndex = 10 - offset;
                    // JS 覆蓋 CSS transform 以實現動態堆疊
                    card.style.transform = `translate(${offset * 20}px, ${offset * 20}px) scale(${scale})`;
                    card.style.opacity = 1 - (offset * 0.2);
                } else {
                    card.style.opacity = 0;
                    card.style.zIndex = 0;
                }
            }
        });

        updateNavigation();
        
        // 切換卡片後，重新檢查該卡片內的動畫元素
        setTimeout(() => {
            const activeCard = cards[currentIndex];
            const inner = activeCard.querySelector('.card-inner');
            if(inner) checkReveal(inner);
        }, 100);
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

        setTimeout(() => {
            isAnimating = false;
        }, 800); // 動畫冷卻時間
    }

    // 滾輪監聽 (Smart Scrolling)
    window.addEventListener('wheel', (e) => {
        if (isAnimating) return;

        const currentCard = cards[currentIndex];
        const inner = currentCard.querySelector('.card-inner');
        if (!inner) return;

        const delta = e.deltaY;
        // 容許誤差值
        const tolerance = 5; 

        const isAtTop = inner.scrollTop <= 0;
        const isAtBottom = Math.ceil(inner.scrollTop + inner.clientHeight) >= inner.scrollHeight - tolerance;

        // 邏輯：
        // 1. 往下滾 & 內容已到底 -> 下一張
        // 2. 往上滾 & 內容已到頂 -> 上一張
        if (delta > 0 && isAtBottom) {
            if (currentIndex < totalCards - 1) goToCard(currentIndex + 1);
        } else if (delta < 0 && isAtTop) {
            if (currentIndex > 0) goToCard(currentIndex - 1);
        }
        // 否則讓瀏覽器處理內部捲動
    }, { passive: true });

    // 導覽點擊
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            const targetIndex = cards.findIndex(c => c.id === targetId);
            if (targetIndex !== -1) goToCard(targetIndex);
        });
    });

    if (logoLink) {
        logoLink.addEventListener('click', (e) => {
            e.preventDefault();
            goToCard(0);
        });
    }


    // =========================================================
    // 2. Animations (Scroll Reveal & Counter)
    // =========================================================
    let hasCountedLeetCode = false; // 避免重複跑動畫

    function checkReveal(container) {
        const reveals = container.querySelectorAll('.reveal, .reveal-delay-1, .reveal-delay-2');
        const windowHeight = window.innerHeight;
        const elementVisible = 50;

        reveals.forEach((reveal) => {
            const elementTop = reveal.getBoundingClientRect().top;
            if (elementTop < windowHeight - elementVisible) {
                reveal.classList.add('active');

                // 特判：如果這個區塊包含 LeetCode 計數器，且尚未跑過
                if (reveal.querySelector('.counter') && !hasCountedLeetCode) {
                    // 確保 API 資料回來後才跑動畫，這裡設個延遲保險
                    setTimeout(runCounters, 500);
                    hasCountedLeetCode = true;
                }
            }
        });
    }

    // 為每個卡片內部綁定捲動偵測
    document.querySelectorAll('.card-inner').forEach(inner => {
        inner.addEventListener('scroll', () => checkReveal(inner));
    });


    function runCounters() {
        const counters = document.querySelectorAll('.counter');
        const speed = 1000; // ms

        counters.forEach(counter => {
            // 優先使用 API 更新後的 data-target，如果沒有則用預設
            const target = +counter.getAttribute('data-target');
            
            const updateCount = () => {
                const current = +counter.innerText;
                const increment = target / (speed / 16);

                if (current < target) {
                    counter.innerText = Math.ceil(current + increment);
                    setTimeout(updateCount, 16);
                } else {
                    counter.innerText = target;
                }
            };
            updateCount();
        });
    }


    // =========================================================
    // 3. API Integrations (Fetch Data)
    // =========================================================
    
    // 3.1 GitHub API (Repos & Events)
    const GITHUB_USERNAME = 'potato-yen';

    async function fetchGitHubStats() {
        try {
            // Fetch Repos for Stars & Updated Time
            const repoRes = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`);
            if (!repoRes.ok) throw new Error('GitHub Repos fetch failed');
            const repos = await repoRes.json();

            // Helper to update specific project stats
            const updateRepoUI = (elementId, repoName) => {
                const el = document.getElementById(elementId);
                if (!el) return;
                
                const repo = repos.find(r => r.name === repoName);
                if (repo) {
                    const date = new Date(repo.pushed_at).toISOString().split('T')[0];
                    el.innerHTML = `<span>⭐ ${repo.stargazers_count}</span> • <span>📅 ${date}</span>`;
                }
            };

            // Update Projects in UI
            updateRepoUI('gh-editor-stats', 'online-editor');
            updateRepoUI('gh-news-stats', 'Daily-News-Email-Digest');
            updateRepoUI('gh-portfolio-stats', 'web-repo');

            // Fetch Activity (Events)
            const eventsRes = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/events?per_page=5`);
            if (!eventsRes.ok) throw new Error('GitHub Events fetch failed');
            const events = await eventsRes.json();
            
            const activityList = document.getElementById('gh-activity-list');
            if (activityList) {
                activityList.innerHTML = ''; // Clear loading text
                events.forEach(evt => {
                    let action = '';
                    let target = evt.repo.name.split('/')[1]; // remote username
                    
                    if (evt.type === 'PushEvent') {
                        action = `Pushed to <strong>${target}</strong>`;
                    } else if (evt.type === 'CreateEvent') {
                        action = `Created <strong>${target}</strong>`;
                    } else if (evt.type === 'WatchEvent') {
                        action = `Starred <strong>${target}</strong>`;
                    } else {
                        return; // Skip other events to keep it clean
                    }
                    
                    const li = document.createElement('li');
                    li.innerHTML = `${action} <span style="opacity:0.5; font-size:0.8em; float:right;">${new Date(evt.created_at).toLocaleDateString()}</span>`;
                    activityList.appendChild(li);
                });
            }

        } catch (error) {
            console.error('GitHub API Error:', error);
        }
    }

    // 3.2 LeetCode API (via Proxy)
    async function fetchLeetCodeStats() {
        try {
            // 使用第三方 Proxy 解決 CORS 問題
            const res = await fetch(`https://leetcode-stats-api.herokuapp.com/potatoyen`); 
            // 注意：如果您的 LeetCode ID 不同於 GitHub，請手動修改上面的變數

            if (!res.ok) throw new Error('LeetCode fetch failed');
            const data = await res.json();

            if (data.status === 'success') {
                // 更新 DOM 屬性，等待 runCounters 觸發
                const easyEl = document.getElementById('leetcode-easy');
                const mediumEl = document.getElementById('leetcode-medium');
                
                if (easyEl) easyEl.setAttribute('data-target', data.easySolved);
                if (mediumEl) mediumEl.setAttribute('data-target', data.mediumSolved);
                
                // 如果卡片已經顯示，立即更新一次數字
                if (document.querySelector('#about').classList.contains('active')) {
                    runCounters();
                }
            }
        } catch (error) {
            console.error('LeetCode API Error:', error);
            // Fallback: 如果 API 失敗，保持 HTML 裡的預設值或手動設定
        }
    }

    // 3.3 Quotable API
    async function fetchQuote() {
        try {
            const res = await fetch('https://api.quotable.io/random?tags=technology,wisdom');
            if (!res.ok) throw new Error('Quote fetch failed');
            const data = await res.json();

            const quoteText = document.getElementById('quote-text');
            const quoteAuthor = document.getElementById('quote-author');

            if (quoteText) quoteText.innerText = `"${data.content}"`;
            if (quoteAuthor) quoteAuthor.innerText = `— ${data.author}`;
        } catch (error) {
            console.error('Quote API Error:', error);
            // Fallback quote
            const quoteText = document.getElementById('quote-text');
            if (quoteText) quoteText.innerText = '"The best way to predict the future is to invent it."';
        }
    }

    // 執行所有初始化
    updateCards(); // UI Init
    fetchGitHubStats(); // API 1
    fetchLeetCodeStats(); // API 2
    fetchQuote(); // API 3
});