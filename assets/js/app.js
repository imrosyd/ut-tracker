const PERSONAL_LINKS_KEY = 'utTrackerPersonalLinks';
const MODULES_PER_SKS = 3;
const TUTORIAL_SESSIONS = 8;
const TUTORIAL_TASKS = 3;
const PRAKTIK_TASKS = 3;
const MOBILE_MAX_WIDTH = 767;
const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_MAX_WIDTH}px)`;

const VALID_THEMES = new Set(['light', 'dark']);

const SCHEME_DETAILS = {
    Tuton: {
        label: 'Tutorial Online',
        badgeClass: 'course-badge course-badge--tuton'
    },
    Tuweb: {
        label: 'Tutorial Webinar',
        badgeClass: 'course-badge course-badge--tuweb'
    },
    TTM: {
        label: 'Tutorial Tatap Muka',
        badgeClass: 'course-badge course-badge--ttm'
    },
    Berpraktik: {
        label: 'Berpraktik',
        badgeClass: 'course-badge course-badge--berpraktik'
    },
    Berpraktikum: {
        label: 'Berpraktikum',
        badgeClass: 'course-badge course-badge--berpraktikum'
    },
    Praktik: {
        label: 'Praktik',
        badgeClass: 'course-badge course-badge--praktik'
    },
    Praktikum: {
        label: 'Praktikum',
        badgeClass: 'course-badge course-badge--praktikum'
    },
    'Hanya UAS': {
        label: 'Hanya UAS',
        badgeClass: 'course-badge course-badge--default'
    }
};

let courses = [];
let selectedCourseIndex = null;
let selectedCategory = null;
let desktopGuardInitialized = false;
let mobileViewportMediaQuery = null;
let personalLinks = [];

function applyTheme(theme, options = {}) {
    const desiredTheme = VALID_THEMES.has(theme) ? theme : 'light';
    const root = document.documentElement;

    root.classList.toggle('dark', desiredTheme === 'dark');
    root.dataset.theme = desiredTheme;

    if (options.persist !== false) {
        try {
            localStorage.setItem('theme', desiredTheme);
        } catch (error) {
            console.warn('Gagal menyimpan tema:', error);
        }
    }

    if (options.onApply && typeof options.onApply === 'function') {
        options.onApply(desiredTheme);
    }

    return desiredTheme;
}

function isMobileViewport() {
    if (typeof window === 'undefined') return false;
    if (typeof window.matchMedia === 'function') {
        return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
    }
    return window.innerWidth <= MOBILE_MAX_WIDTH;
}

function enforceDesktopExperience() {
    if (typeof document === 'undefined') return;

    const appRoot = document.getElementById('app-root');
    const warning = document.getElementById('mobile-warning');

    if (!appRoot || !warning) return;

    const shouldBlock = isMobileViewport();

    document.body.classList.toggle('mobile-blocked', shouldBlock);

    if (shouldBlock) {
        warning.removeAttribute('hidden');
        warning.setAttribute('aria-hidden', 'false');
        appRoot.setAttribute('aria-hidden', 'true');
        appRoot.setAttribute('data-mobile-hidden', 'true');
    } else {
        warning.setAttribute('aria-hidden', 'true');
        warning.setAttribute('hidden', 'hidden');
        appRoot.removeAttribute('aria-hidden');
        appRoot.removeAttribute('data-mobile-hidden');
    }
}

function setupDesktopOnlyGuard() {
    if (desktopGuardInitialized) return;
    desktopGuardInitialized = true;

    if (typeof window !== 'undefined') {
        enforceDesktopExperience();

        if (typeof window.matchMedia === 'function') {
            mobileViewportMediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
            const listener = () => enforceDesktopExperience();
            if (typeof mobileViewportMediaQuery.addEventListener === 'function') {
                mobileViewportMediaQuery.addEventListener('change', listener);
            } else if (typeof mobileViewportMediaQuery.addListener === 'function') {
                mobileViewportMediaQuery.addListener(listener);
            }
        }

        window.addEventListener('resize', enforceDesktopExperience);
        window.addEventListener('orientationchange', enforceDesktopExperience);
    }
}

const DATETIME_LOCAL_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const DATETIME_LOCAL_WITH_SECONDS_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;

function toDatetimeLocalMinutes(value) {
    if (DATETIME_LOCAL_PATTERN.test(value)) {
        return value;
    }
    if (DATETIME_LOCAL_WITH_SECONDS_PATTERN.test(value)) {
        return value.slice(0, 16);
    }
    return '';
}

function sanitizeDatetimeLocal(value) {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (trimmed === '') return '';

    const normalized = toDatetimeLocalMinutes(trimmed);
    if (normalized) {
        return normalized;
    }

    const withT = trimmed.replace(' ', 'T');
    const normalizedWithT = toDatetimeLocalMinutes(withT);
    if (normalizedWithT) {
        return normalizedWithT;
    }

    const match = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
    if (!match) {
        return '';
    }

    const [, day, month, year, hour = '00', minute = '00'] = match;
    const dayPadded = day.padStart(2, '0');
    const monthPadded = month.padStart(2, '0');
    const hourPadded = hour.padStart(2, '0');
    const minutePadded = minute.padStart(2, '0');

    const candidate = `${year}-${monthPadded}-${dayPadded}T${hourPadded}:${minutePadded}`;
    return toDatetimeLocalMinutes(candidate);
}

function getGradeDetails(score) {
    if (score > 80) return { letter: 'A', point: 4.0 };
    if (score >= 75) return { letter: 'A-', point: 3.5 };
    if (score >= 70) return { letter: 'B', point: 3.0 };
    if (score >= 65) return { letter: 'B-', point: 2.5 };
    if (score >= 60) return { letter: 'C', point: 2.0 };
    if (score >= 55) return { letter: 'C-', point: 1.5 };
    if (score >= 50) return { letter: 'D', point: 1.0 };
    if (score >= 0) return { letter: 'E', point: 0.0 };
    return { letter: '-', point: 0.0 };
}

function calculateFinalScore(course) {
    const hasTutorial = ['Tuton', 'Tuweb', 'TTM'].includes(course.scheme);
    const hasPraktik = ['Berpraktik', 'Berpraktikum', 'Praktik', 'Praktikum'].includes(course.scheme);
    const hasUas = !['Praktik', 'Praktikum'].includes(course.scheme);

    let totalTutorialScore = 0;
    let tutorialScore = 0;

    if (hasTutorial) {
        const presensiSum = course.tutorial.presensi.reduce((sum, hadir) => sum + (hadir ? 100 : 0), 0);
        let diskusiSum = 0;
        let diskusiCount = 0;
        course.tutorial.diskusi.forEach((nilai, idx) => {
            const status = course.tutorial.diskusiStatus?.[idx];
            const parsed = parseFloat(nilai);
            if (!status || Number.isNaN(parsed) || parsed <= 0) {
                return;
            }
            const clamped = Math.min(100, parsed);
            diskusiSum += clamped;
            diskusiCount += 1;
        });
        const presensiAvg = presensiSum / TUTORIAL_SESSIONS;
        const presensiScore = (presensiAvg / 100) * 20;
        const diskusiAvg = diskusiCount > 0 ? diskusiSum / diskusiCount : 0;
        const diskusiScore = (diskusiAvg / 100) * 30;

        let totalTugasNilai = 0;
        let tugasCount = 0;
        course.tutorial.tugasNilai.forEach((nilai, index) => {
            const parsed = parseFloat(nilai);
            if (course.tutorial.tugasStatus[index] && !Number.isNaN(parsed) && parsed >= 0) {
                totalTugasNilai += parsed;
                tugasCount++;
            }
        });
        const avgTugasNilai = tugasCount > 0 ? totalTugasNilai / tugasCount : 0;
        const tugasScore = (avgTugasNilai / 100) * 50;
        totalTutorialScore = presensiScore + diskusiScore + tugasScore;
        tutorialScore = totalTutorialScore;
    }

    let totalPraktikScore = 0;
    if (hasPraktik) {
        let totalPraktikNilai = 0;
        let praktikCount = 0;
        course.praktik.nilai.forEach((nilai, index) => {
            const parsed = parseFloat(nilai);
            if (course.praktik.status[index] && !Number.isNaN(parsed) && parsed >= 0) {
                totalPraktikNilai += parsed;
                praktikCount++;
            }
        });
        totalPraktikScore = praktikCount > 0 ? totalPraktikNilai / praktikCount : 0;
        if (!hasTutorial) {
            tutorialScore = totalPraktikScore;
        }
    }

    const uasScoreCandidate = parseFloat(course.uas.target);
    const uasScore = Number.isNaN(uasScoreCandidate) || uasScoreCandidate < 0 ? 0 : Math.min(100, uasScoreCandidate);
    let finalScore = 0;

    switch (course.scheme) {
        case 'Tuton':
            finalScore = totalTutorialScore * 0.3 + uasScore * 0.7;
            break;
        case 'Tuweb':
        case 'TTM':
            finalScore = totalTutorialScore * 0.5 + uasScore * 0.5;
            break;
        case 'Berpraktik':
        case 'Berpraktikum':
            finalScore = totalPraktikScore * 0.6 + uasScore * 0.4;
            break;
        case 'Praktik':
        case 'Praktikum':
            finalScore = totalPraktikScore;
            break;
        case 'Hanya UAS':
            finalScore = uasScore;
            break;
        default:
            finalScore = uasScore;
            break;
    }

    const gradeDetails = getGradeDetails(finalScore);
    const sks = parseInt(course.sks, 10) || 0;
    const tutorialScoreDisplay = (hasTutorial || hasPraktik) ? tutorialScore.toFixed(2) : '-';
    const uasScoreDisplay = hasUas ? uasScore.toFixed(2) : '-';

    return {
        tutorialScore: tutorialScoreDisplay,
        uasScore: uasScoreDisplay,
        finalScore: finalScore.toFixed(2),
        letterGrade: gradeDetails.letter,
        gradePoint: gradeDetails.point,
        nilaiMutu: (sks * gradeDetails.point).toFixed(2)
    };
}

function calculateCourseProgress(course) {
    const hasTutorial = ['Tuton', 'Tuweb', 'TTM'].includes(course.scheme);
    const hasPraktik = ['Berpraktik', 'Berpraktikum', 'Praktik', 'Praktikum'].includes(course.scheme);
    const hasUas = !['Praktik', 'Praktikum'].includes(course.scheme);

    let completed = 0;
    let total = 0;

    const addItem = (isCompleted) => {
        total += 1;
        if (isCompleted) {
            completed += 1;
        }
    };

    if (hasTutorial) {
        course.tutorial.presensi.forEach((hadir) => {
            addItem(Boolean(hadir));
        });
        course.tutorial.diskusiStatus.forEach((status) => {
            addItem(Boolean(status));
        });
        course.tutorial.tugasStatus.forEach((status) => {
            addItem(Boolean(status));
        });
    }

    if (hasPraktik) {
        course.praktik.status.forEach((status) => {
            addItem(Boolean(status));
        });
    }

    if (hasUas) {
        const jadwalSet = typeof course.uas.jadwal === 'string' && course.uas.jadwal !== '';
        const targetSet = typeof course.uas.target === 'string' && course.uas.target !== '';
        addItem(jadwalSet);
        addItem(targetSet);
        course.uas.modul.forEach((modulSelesai) => {
            addItem(Boolean(modulSelesai));
        });
    }

    if (total === 0) {
        return {
            completed: 0,
            total: 0,
            percent: 0,
            label: 'Belum ada aktivitas'
        };
    }

    const percent = Math.round((completed / total) * 100);
    const clampedPercent = Math.min(100, Math.max(0, percent));

    return {
        completed,
        total,
        percent: clampedPercent,
        label: `${completed} dari ${total} aktivitas`
    };
}

function ensureArray(source, length, defaultValue) {
    const base = Array.isArray(source) ? source.slice(0, length) : [];
    while (base.length < length) {
        base.push(defaultValue);
    }
    return base;
}

function getModuleCount(sks) {
    const sksNumber = parseInt(sks, 10);
    if (Number.isNaN(sksNumber) || sksNumber <= 0) {
        return MODULES_PER_SKS;
    }
    return sksNumber * MODULES_PER_SKS;
}

function normalizeCourse(rawCourse) {
    const presensi = ensureArray(rawCourse.tutorial?.presensi, TUTORIAL_SESSIONS, false);
    const rawDiskusi = ensureArray(rawCourse.tutorial?.diskusi, TUTORIAL_SESSIONS, '');
    const diskusi = rawDiskusi.map((value) => {
        if (value === true) return '100';
        if (value === false) return '';
        const parsed = parseFloat(value);
        if (Number.isNaN(parsed) || parsed <= 0) return '';
        const clamped = Math.min(100, parsed);
        return clamped.toString();
    });
    const diskusiStatus = ensureArray(rawCourse.tutorial?.diskusiStatus, TUTORIAL_SESSIONS, false).map((value) => value === true || value === 'true');
    diskusi.forEach((value, idx) => {
        if (value !== '' && !diskusiStatus[idx]) {
            diskusiStatus[idx] = true;
        }
    });
    const tugasStatus = ensureArray(rawCourse.tutorial?.tugasStatus, TUTORIAL_TASKS, false);
    const tugasNilai = ensureArray(rawCourse.tutorial?.tugasNilai, TUTORIAL_TASKS, '');
    const catatanDiskusi = ensureArray(rawCourse.tutorial?.catatanDiskusi, TUTORIAL_SESSIONS, '');

    const course = {
        name: rawCourse.name || '',
        sks: rawCourse.sks || '0',
        scheme: rawCourse.scheme || 'Tuton',
        tutorial: {
            presensi,
            diskusi,
            diskusiStatus,
            tugasStatus,
            tugasNilai,
            catatanDiskusi
        },
        praktik: {
            deskripsi: ensureArray(rawCourse.praktik?.deskripsi, PRAKTIK_TASKS, ''),
            status: ensureArray(rawCourse.praktik?.status, PRAKTIK_TASKS, false),
            nilai: ensureArray(rawCourse.praktik?.nilai, PRAKTIK_TASKS, '')
        },
        uas: {
            jadwal: sanitizeDatetimeLocal(rawCourse.uas?.jadwal || ''),
            target: rawCourse.uas?.target || '',
            modul: []
        }
    };

    const expectedModules = getModuleCount(course.sks);
    course.uas.modul = ensureArray(rawCourse.uas?.modul, expectedModules, false);

    return course;
}

function renderCourses() {
    const container = document.getElementById('courses-container');
    if (!container) return;

    const totalCourses = courses.length;
    let visibleIndexes = [];

    if (selectedCategory) {
        visibleIndexes = courses
            .map((course, index) => (course.scheme === selectedCategory ? index : null))
            .filter((value) => value !== null);
    } else if (selectedCourseIndex !== null) {
        if (courses[selectedCourseIndex]) {
            visibleIndexes = [selectedCourseIndex];
        }
    } else {
        visibleIndexes = courses.map((_, index) => index);
    }

    const shouldShowPlaceholder = totalCourses === 0 || visibleIndexes.length === 0;

    container.innerHTML = '';

    if (shouldShowPlaceholder) {
        const message = totalCourses === 0
            ? {
                  title: 'Belum Ada Mata Kuliah',
                  description: 'Gunakan form di atas untuk memulai.'
              }
            : {
                  title: 'Pilih Mata Kuliah',
                  description: 'Gunakan navigator atau kategori di sebelah kiri untuk menampilkan data.'
              };

        container.innerHTML = `
            <div class="empty-state text-center py-12 px-6 bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 class="mt-2 text-lg font-semibold text-slate-900 dark:text-white">${message.title}</h3>
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">${message.description}</p>
            </div>
        `;
    } else {
        visibleIndexes.forEach((index) => {
            const course = courses[index];
            const courseCard = document.createElement('div');
            courseCard.id = `course-${index}`;
            courseCard.className = 'bg-white dark:bg-slate-900/80 p-6 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 shadow-sm tracker-card scroll-mt-24';
            courseCard.innerHTML = generateCourseCardHTML(course, index);
            container.appendChild(courseCard);
        });
    }

    updateSummary();
    renderCategoryFilters();
    renderNavigation();
}

function updateSummary() {
    const totalMkEl = document.getElementById('total-mk');
    const totalSksEl = document.getElementById('total-sks');
    const totalIpEl = document.getElementById('total-ip');
    if (!totalMkEl || !totalSksEl || !totalIpEl) return;

    let totalSks = 0;
    let totalNilaiMutu = 0;
    let completedCourses = 0;
    let ongoingCourses = 0;
    let notStartedCourses = 0;
    let activeCourses = 0;
    let totalProgressItems = 0;
    let completedProgressItems = 0;
    let highestScore = null;
    let lowestScore = null;
    let scoreSum = 0;
    let scoreCount = 0;

    courses.forEach((course) => {
        const sks = parseInt(course.sks, 10) || 0;
        const calculation = calculateFinalScore(course);
        const nilaiMutu = parseFloat(calculation.nilaiMutu);

        if (sks > 0 && !Number.isNaN(nilaiMutu)) {
            totalSks += sks;
            totalNilaiMutu += nilaiMutu;
        }

        const finalScoreNumeric = parseFloat(calculation.finalScore);
        if (!Number.isNaN(finalScoreNumeric)) {
            highestScore = highestScore === null ? finalScoreNumeric : Math.max(highestScore, finalScoreNumeric);
            lowestScore = lowestScore === null ? finalScoreNumeric : Math.min(lowestScore, finalScoreNumeric);
            scoreSum += finalScoreNumeric;
            scoreCount += 1;
        }

        const progress = calculateCourseProgress(course);
        totalProgressItems += progress.total;
        completedProgressItems += progress.completed;

        if (progress.total === 0 || progress.completed === 0) {
            notStartedCourses += 1;
        } else if (progress.completed === progress.total) {
            completedCourses += 1;
        } else {
            ongoingCourses += 1;
        }

        if (progress.completed > 0) {
            activeCourses += 1;
        }
    });

    const ipk = totalSks > 0 ? (totalNilaiMutu / totalSks).toFixed(2) : '0.00';

    totalMkEl.textContent = courses.length;
    totalSksEl.textContent = totalSks;
    totalIpEl.textContent = ipk;

    const overallProgressEl = document.getElementById('overall-progress');
    const progressBarEl = document.getElementById('progress-bar');
    if (overallProgressEl && progressBarEl) {
        const overallPercent = totalProgressItems > 0 ? Math.round((completedProgressItems / totalProgressItems) * 100) : 0;
        overallProgressEl.textContent = `${overallPercent}%`;
        progressBarEl.style.width = `${overallPercent}%`;
    }

    const completedCountEl = document.getElementById('completed-count');
    const ongoingCountEl = document.getElementById('ongoing-count');
    const notStartedCountEl = document.getElementById('not-started-count');
    if (completedCountEl && ongoingCountEl && notStartedCountEl) {
        completedCountEl.textContent = completedCourses;
        ongoingCountEl.textContent = ongoingCourses;
        notStartedCountEl.textContent = notStartedCourses;
    }

    const activeCoursesEl = document.getElementById('active-courses');
    if (activeCoursesEl) {
        activeCoursesEl.textContent = activeCourses;
    }

    const highestIpEl = document.getElementById('highest-ip');
    const lowestIpEl = document.getElementById('lowest-ip');
    const averageIpEl = document.getElementById('average-ip');
    if (highestIpEl && lowestIpEl && averageIpEl) {
        highestIpEl.textContent = highestScore !== null ? highestScore.toFixed(2) : '-';
        lowestIpEl.textContent = lowestScore !== null ? lowestScore.toFixed(2) : '-';
        averageIpEl.textContent = scoreCount > 0 ? (scoreSum / scoreCount).toFixed(2) : '-';
    }
}

function renderNavigation() {
    const navContainer = document.getElementById('course-nav');
    if (!navContainer) return;

    navContainer.innerHTML = '';

    if (courses.length === 0) {
        navContainer.innerHTML = '<p class="text-xs text-slate-500 dark:text-slate-400">Belum ada mata kuliah. Tambahkan melalui formulir di atas.</p>';
        return;
    }

    const fragment = document.createDocumentFragment();

    courses.forEach((course, index) => {
        const { letterGrade } = calculateFinalScore(course);
        const sks = parseInt(course.sks, 10) || 0;
        const isActive = selectedCategory === null && selectedCourseIndex === index;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = `text-left rounded-xl border px-3 py-2 shadow-sm transition-colors focus:outline-none ${
            isActive
                ? 'border-blue-500 bg-blue-50/80 text-blue-700 dark:border-blue-400 dark:bg-slate-800/80 dark:text-blue-200'
                : 'border-transparent bg-white/70 text-slate-700 dark:bg-slate-900/40 dark:text-slate-200 hover:border-blue-200 dark:hover:border-blue-500 hover:bg-blue-50/60 dark:hover:bg-slate-800/80'
        }`;

        button.addEventListener('click', () => {
            selectedCourseIndex = index;
            selectedCategory = null;
            renderCourses();
            const card = document.getElementById(`course-${index}`);
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });

        const infoWrapper = document.createElement('div');
        infoWrapper.className = 'flex flex-col';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'text-sm font-medium leading-snug';
        nameSpan.textContent = course.name;

        const metaSpan = document.createElement('span');
        metaSpan.className = 'text-xs text-slate-500 dark:text-slate-400';
        metaSpan.textContent = `${letterGrade} • ${sks} SKS`;

        infoWrapper.appendChild(nameSpan);
        infoWrapper.appendChild(metaSpan);
        button.appendChild(infoWrapper);

        fragment.appendChild(button);
    });

    navContainer.appendChild(fragment);
}

function renderCategoryFilters() {
    const filterContainer = document.getElementById('category-filter');
    if (!filterContainer) return;

    filterContainer.innerHTML = '';

    if (courses.length === 0) {
        filterContainer.innerHTML = '<p class="text-xs text-slate-500 dark:text-slate-400">Belum ada kategori.</p>';
        return;
    }

    const uniqueSchemes = Array.from(new Set(courses.map((course) => course.scheme)));

    if (uniqueSchemes.length === 0) {
        filterContainer.innerHTML = '<p class="text-xs text-slate-500 dark:text-slate-400">Kategori belum tersedia.</p>';
        return;
    }

    const createChip = (label, isActive, onClick) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = `inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none ${
            isActive
                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-slate-800/80 dark:text-blue-200'
                : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:border-blue-400 dark:hover:text-blue-200'
        }`;
        chip.textContent = label;
        chip.addEventListener('click', onClick);
        return chip;
    };

    const resetChip = createChip('Reset', selectedCourseIndex === null && selectedCategory === null, () => {
        selectedCourseIndex = null;
        selectedCategory = null;
        renderCourses();
    });
    filterContainer.appendChild(resetChip);

    uniqueSchemes.forEach((scheme) => {
        const detail = SCHEME_DETAILS[scheme] || { label: scheme };
        const chip = createChip(detail.label, selectedCategory === scheme, () => {
            selectedCategory = scheme;
            selectedCourseIndex = null;
            renderCourses();
        });
        filterContainer.appendChild(chip);
    });
}

function generateCourseCardHTML(course, index) {
    const detail = SCHEME_DETAILS[course.scheme] || {
        label: course.scheme,
        badgeClass: 'bg-slate-200 text-slate-700 dark:bg-slate-700/70 dark:text-slate-200'
    };

    const hasTutorial = ['Tuton', 'Tuweb', 'TTM'].includes(course.scheme);
    const hasPraktik = ['Berpraktik', 'Berpraktikum', 'Praktik', 'Praktikum'].includes(course.scheme);
    const hasUas = !['Praktik', 'Praktikum'].includes(course.scheme);

    const calculation = calculateFinalScore(course);
    const progress = calculateCourseProgress(course);
    const moduleCount = getModuleCount(course.sks);

    const tutorialSection = hasTutorial
        ? `
            <div class="mt-6 border-t border-slate-200/60 dark:border-slate-700/60 pt-6">
                <h4 class="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-100">Progress Tutorial</h4>
                <div class="overflow-x-auto rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                    <table class="w-full text-sm text-left">
                        <thead class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/70">
                            <tr>
                                <th class="p-3">Sesi</th>
                                <th class="p-3">Presensi</th>
                                <th class="p-3">Status Diskusi</th>
                                <th class="p-3">Nilai Diskusi</th>
                                <th class="p-3">Catatan</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
                            ${Array.from({ length: TUTORIAL_SESSIONS }, (_, i) => `
                                <tr>
                                    <td class="p-3 font-medium">${i + 1}</td>
                                    <td class="p-3">
                                        <input type="checkbox" onchange="updateItem(${index}, 'presensi', ${i})" ${course.tutorial.presensi[i] ? 'checked' : ''} class="h-4 w-4 rounded border-slate-300 dark:border-slate-600">
                                    </td>
                                    <td class="p-3">
                                        <input type="checkbox" onchange="updateItem(${index}, 'diskusiStatus', ${i})" ${course.tutorial.diskusiStatus?.[i] ? 'checked' : ''} class="h-4 w-4 rounded border-slate-300 dark:border-slate-600">
                                    </td>
                                    <td class="p-3">
                                        <input type="number" min="0" max="100" step="1" placeholder="0-100" onchange="updateItem(${index}, 'diskusi', ${i}, this.value)" value="${course.tutorial.diskusi?.[i] ?? ''}" class="w-24 px-3 py-2 bg-transparent border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    </td>
                                    <td class="p-3">
                                        <input type="text" oninput="updateItem(${index}, 'catatanDiskusi', ${i}, this.value)" value="${course.tutorial.catatanDiskusi?.[i] || ''}" class="w-full px-3 py-2 bg-transparent border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <h5 class="font-semibold mt-6 mb-3">Tugas Wajib</h5>
                <div class="overflow-x-auto rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                    <table class="w-full text-sm text-left">
                        <thead class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/70">
                            <tr>
                                <th class="p-3">Tugas</th>
                                <th class="p-3">Sesi</th>
                                <th class="p-3">Status</th>
                                <th class="p-3">Nilai</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
                            ${Array.from({ length: TUTORIAL_TASKS }, (_, i) => {
                                const session = i === 0 ? 3 : i === 1 ? 5 : 7;
                                return `
                                    <tr>
                                        <td class="p-3 font-medium">Tugas ${i + 1}</td>
                                        <td class="p-3">${session}</td>
                                        <td class="p-3">
                                            <input type="checkbox" onchange="updateItem(${index}, 'tugasStatus', ${i})" ${course.tutorial.tugasStatus[i] ? 'checked' : ''} class="h-4 w-4 rounded border-slate-300 dark:border-slate-600">
                                        </td>
                                        <td class="p-3">
                                            <input type="number" min="0" max="100" placeholder="0-100" onchange="updateItem(${index}, 'tugasNilai', ${i}, this.value)" value="${course.tutorial.tugasNilai[i]}" class="w-24 px-3 py-2 bg-transparent border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `
        : '';

    const praktikSection = hasPraktik
        ? `
            <div class="mt-6 border-t border-slate-200/60 dark:border-slate-700/60 pt-6">
                <h4 class="text-lg font-semibold mb-3">Progress Praktik/Praktikum</h4>
                <div class="overflow-x-auto rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                    <table class="w-full text-sm text-left">
                        <thead class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/70">
                            <tr>
                                <th class="p-3">Tugas</th>
                                <th class="p-3">Deskripsi</th>
                                <th class="p-3">Status</th>
                                <th class="p-3">Nilai</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
                            ${Array.from({ length: PRAKTIK_TASKS }, (_, i) => `
                                <tr>
                                    <td class="p-3 font-medium">Tugas ${i + 1}</td>
                                    <td class="p-3">
                                        <input type="text" oninput="updateItem(${index}, 'praktikDeskripsi', ${i}, this.value)" value="${course.praktik.deskripsi[i]}" class="w-full px-3 py-2 bg-transparent border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    </td>
                                    <td class="p-3">
                                        <input type="checkbox" onchange="updateItem(${index}, 'praktikStatus', ${i})" ${course.praktik.status[i] ? 'checked' : ''} class="h-4 w-4 rounded border-slate-300 dark:border-slate-600">
                                    </td>
                                        <td class="p-3">
                                        <input type="number" min="0" max="100" onchange="updateItem(${index}, 'praktikNilai', ${i}, this.value)" value="${course.praktik.nilai[i]}" class="w-24 px-3 py-2 bg-transparent border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `
        : '';

    const uasSection = hasUas
        ? `
            <div class="mt-6 border-t border-slate-200/60 dark:border-slate-700/60 pt-6">
                <h4 class="text-lg font-semibold mb-3">Persiapan UAS</h4>
                <div class="grid md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label class="text-sm font-medium">Jadwal UAS</label>
                        <input type="datetime-local" onchange="updateItem(${index}, 'uasJadwal', null, this.value)" value="${course.uas.jadwal}" class="w-full mt-1 px-3 py-2 bg-transparent border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" step="60">
                    </div>
                    <div>
                        <label class="text-sm font-medium">Target/Nilai UAS</label>
                        <input type="number" min="0" max="100" onchange="updateItem(${index}, 'uasTarget', null, this.value)" value="${course.uas.target}" class="w-full mt-1 px-3 py-2 bg-transparent border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                </div>
                <h5 class="font-semibold mb-3">Checklist Belajar Modul</h5>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    ${Array.from({ length: moduleCount }, (_, i) => `
                        <div class="flex items-center gap-2">
                            <input type="checkbox" id="modul-${index}-${i}" onchange="updateItem(${index}, 'modul', ${i})" ${course.uas.modul[i] ? 'checked' : ''} class="h-4 w-4 rounded border-slate-300 dark:border-slate-600 task-input">
                            <label for="modul-${index}-${i}" class="text-sm">Modul ${i + 1}</label>
                        </div>
                    `).join('')}
                </div>
            </div>
        `
        : '';

    return `
        <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
                <h3 class="text-xl font-bold text-slate-900 dark:text-white">${course.name}</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400">${course.sks} SKS • <span class="${detail.badgeClass}">${detail.label}</span></p>
            </div>
            <button onclick="deleteCourse(${index})" class="text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full p-2 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
            </button>
        </div>
    <div class="mt-4 summary-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 text-center bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl">
            <div class="flex flex-col gap-1">
                <p class="text-xs tracking-wide text-slate-500 dark:text-slate-400 uppercase">Nilai Tutorial</p>
                <p class="text-2xl font-bold text-slate-900 dark:text-white">${calculation.tutorialScore}</p>
            </div>
            <div class="flex flex-col gap-1">
                <p class="text-xs tracking-wide text-slate-500 dark:text-slate-400 uppercase">Nilai UAS</p>
                <p class="text-2xl font-bold text-slate-900 dark:text-white">${calculation.uasScore}</p>
            </div>
            <div class="flex flex-col gap-1">
                <p class="text-xs tracking-wide text-slate-500 dark:text-slate-400 uppercase">Nilai Akhir</p>
                <p class="text-2xl font-bold text-slate-900 dark:text-white">${calculation.finalScore}</p>
            </div>
            <div class="flex flex-col gap-1">
                <p class="text-xs tracking-wide text-slate-500 dark:text-slate-400 uppercase">Nilai Huruf</p>
                <p class="text-2xl font-bold text-slate-900 dark:text-white">${calculation.letterGrade}</p>
            </div>
            <div class="flex flex-col gap-1">
                <p class="text-xs tracking-wide text-slate-500 dark:text-slate-400 uppercase">Nilai Mutu</p>
                <p class="text-2xl font-bold text-slate-900 dark:text-white">${calculation.nilaiMutu}</p>
            </div>
            <div class="flex flex-col gap-2 items-center">
                <p class="text-xs tracking-wide text-slate-500 dark:text-slate-400 uppercase">Progress Belajar</p>
                <p class="text-2xl font-bold text-slate-900 dark:text-white">${progress.percent}%</p>
                <div class="summary-progress">
                    <div class="summary-progress-track">
                        <div class="summary-progress-fill" style="width: ${progress.percent}%;"></div>
                    </div>
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400">${progress.label}</p>
            </div>
        </div>
        ${tutorialSection}
        ${praktikSection}
        ${uasSection}
    `;
}

function addCourse() {
    const nameInput = document.getElementById('mkName');
    const sksInput = document.getElementById('mkSks');
    const schemeSelect = document.getElementById('mkScheme');

    if (!nameInput || !sksInput || !schemeSelect) return;

    const name = nameInput.value.trim();
    const sksValue = sksInput.value.trim();

    if (name === '' || sksValue === '') {
        alert('Nama mata kuliah dan SKS tidak boleh kosong!');
        return;
    }

    const totalModules = getModuleCount(sksValue);

    courses.push({
        name,
        sks: sksValue,
        scheme: schemeSelect.value,
        tutorial: {
            presensi: Array(TUTORIAL_SESSIONS).fill(false),
            diskusi: Array(TUTORIAL_SESSIONS).fill(''),
            diskusiStatus: Array(TUTORIAL_SESSIONS).fill(false),
            tugasStatus: Array(TUTORIAL_TASKS).fill(false),
            tugasNilai: Array(TUTORIAL_TASKS).fill(''),
            catatanDiskusi: Array(TUTORIAL_SESSIONS).fill('')
        },
        praktik: {
            deskripsi: Array(PRAKTIK_TASKS).fill(''),
            status: Array(PRAKTIK_TASKS).fill(false),
            nilai: Array(PRAKTIK_TASKS).fill('')
        },
        uas: {
            jadwal: '',
            target: '',
            modul: Array(totalModules).fill(false)
        }
    });

    nameInput.value = '';
    sksInput.value = '';

    selectedCourseIndex = courses.length - 1;
    selectedCategory = null;

    saveAndRender();
}

function deleteCourse(index) {
    if (typeof index !== 'number' || !courses[index]) return;

    if (confirm(`Apakah Anda yakin ingin menghapus "${courses[index].name}"?`)) {
        courses.splice(index, 1);
        if (selectedCourseIndex === index) {
            selectedCourseIndex = null;
        } else if (selectedCourseIndex !== null && selectedCourseIndex > index) {
            selectedCourseIndex -= 1;
        }
        if (courses.every((course) => course.scheme !== selectedCategory)) {
            selectedCategory = null;
        }
        saveAndRender();
    }
}

function updateItem(courseIndex, itemType, itemIndex, value) {
    const course = courses[courseIndex];
    if (!course) return;

    switch (itemType) {
        case 'presensi':
            if (course.tutorial.presensi[itemIndex] !== undefined) {
                course.tutorial.presensi[itemIndex] = !course.tutorial.presensi[itemIndex];
            }
            break;
        case 'diskusi':
            if (course.tutorial.diskusi[itemIndex] !== undefined) {
                if (value === '') {
                    course.tutorial.diskusi[itemIndex] = '';
                    if (course.tutorial.diskusiStatus?.[itemIndex] !== undefined) {
                        course.tutorial.diskusiStatus[itemIndex] = false;
                    }
                } else {
                    const parsed = parseFloat(value);
                    if (Number.isNaN(parsed) || parsed <= 0) {
                        course.tutorial.diskusi[itemIndex] = '';
                        if (course.tutorial.diskusiStatus?.[itemIndex] !== undefined) {
                            course.tutorial.diskusiStatus[itemIndex] = false;
                        }
                    } else {
                        const clamped = Math.min(100, parsed);
                        course.tutorial.diskusi[itemIndex] = clamped.toString();
                        if (course.tutorial.diskusiStatus?.[itemIndex] !== undefined) {
                            course.tutorial.diskusiStatus[itemIndex] = true;
                        }
                    }
                }
            }
            break;
        case 'diskusiStatus':
            if (course.tutorial.diskusiStatus?.[itemIndex] !== undefined) {
                const nextStatus = !course.tutorial.diskusiStatus[itemIndex];
                course.tutorial.diskusiStatus[itemIndex] = nextStatus;
                if (!nextStatus && course.tutorial.diskusi?.[itemIndex] !== undefined) {
                    course.tutorial.diskusi[itemIndex] = '';
                }
            }
            break;
        case 'tugasStatus':
            if (course.tutorial.tugasStatus[itemIndex] !== undefined) {
                course.tutorial.tugasStatus[itemIndex] = !course.tutorial.tugasStatus[itemIndex];
            }
            break;
        case 'tugasNilai':
            if (course.tutorial.tugasNilai[itemIndex] !== undefined) {
                course.tutorial.tugasNilai[itemIndex] = value;
            }
            break;
        case 'catatanDiskusi':
            if (course.tutorial.catatanDiskusi[itemIndex] !== undefined) {
                course.tutorial.catatanDiskusi[itemIndex] = value;
            }
            break;
        case 'praktikDeskripsi':
            if (course.praktik.deskripsi[itemIndex] !== undefined) {
                course.praktik.deskripsi[itemIndex] = value;
            }
            break;
        case 'praktikStatus':
            if (course.praktik.status[itemIndex] !== undefined) {
                course.praktik.status[itemIndex] = !course.praktik.status[itemIndex];
            }
            break;
        case 'praktikNilai':
            if (course.praktik.nilai[itemIndex] !== undefined) {
                course.praktik.nilai[itemIndex] = value;
            }
            break;
        case 'uasJadwal':
            course.uas.jadwal = sanitizeDatetimeLocal(value);
            break;
        case 'uasTarget':
            course.uas.target = value;
            break;
        case 'modul':
            if (course.uas.modul[itemIndex] !== undefined) {
                course.uas.modul[itemIndex] = !course.uas.modul[itemIndex];
            }
            break;
        default:
            break;
    }

    saveAndRender();
}

function saveData() {
    localStorage.setItem('utTrackerData', JSON.stringify(courses));
}

function saveAndRender() {
    saveData();
    renderCourses();
}

function loadData() {
    const data = localStorage.getItem('utTrackerData');
    if (!data) return;

    try {
        const parsed = JSON.parse(data);
        courses = Array.isArray(parsed) ? parsed.map(normalizeCourse) : [];
    } catch (error) {
        console.error('Gagal memuat data UT Tracker:', error);
        courses = [];
    }
}

function initializePersonalLinks() {
    const trigger = document.getElementById('personal-links-trigger');
    const form = document.getElementById('personal-links-form');
    const cancelButton = document.getElementById('personal-link-cancel');
    const labelInput = document.getElementById('personal-link-label');
    const urlInput = document.getElementById('personal-link-url');
    const listElement = document.getElementById('personal-links-list');
    const emptyState = document.getElementById('personal-links-empty');

    if (!trigger || !form || !cancelButton || !labelInput || !urlInput || !listElement || !emptyState) {
        return;
    }

    let formVisible = false;

    const storageAvailable = (() => {
        try {
            const probeKey = `${PERSONAL_LINKS_KEY}::probe`;
            localStorage.setItem(probeKey, '1');
            localStorage.removeItem(probeKey);
            return true;
        } catch (error) {
            console.warn('Penyimpanan localStorage tidak tersedia untuk link pribadi:', error);
            return false;
        }
    })();

    const normalizeLinks = (rawValue) => {
        if (!Array.isArray(rawValue)) return [];
        return rawValue
            .map((entry) => {
                if (!entry || typeof entry !== 'object') return null;
                const id = typeof entry.id === 'string' && entry.id.trim() ? entry.id.trim() : null;
                const label = typeof entry.label === 'string' ? entry.label.trim() : '';
                const url = typeof entry.url === 'string' ? entry.url.trim() : '';
                if (!id || !url) return null;
                return { id, label, url };
            })
            .filter(Boolean);
    };

    const loadLinks = () => {
        try {
            const stored = localStorage.getItem(PERSONAL_LINKS_KEY);
            personalLinks = stored ? normalizeLinks(JSON.parse(stored)) : [];
        } catch (error) {
            console.error('Gagal memuat link pribadi:', error);
            personalLinks = [];
        }
    };

    const persistLinks = () => {
        if (!storageAvailable) return;
        try {
            localStorage.setItem(PERSONAL_LINKS_KEY, JSON.stringify(personalLinks));
        } catch (error) {
            console.error('Gagal menyimpan link pribadi:', error);
        }
    };

    const FALLBACK_FAVICON = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%236781A0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"%3E%3Crect x="3.75" y="3.75" width="16.5" height="16.5" rx="4"/%3E%3Cpath d="M9 8.5h6M8.5 12h7M10.5 15.5h3"/%3E%3C/svg%3E';

    const getFaviconUrl = (targetUrl) => {
        try {
            const parsed = new URL(targetUrl);
            if (!parsed.hostname) return null;
            const encodedHost = encodeURIComponent(parsed.hostname);
            return `https://www.google.com/s2/favicons?domain=${encodedHost}&sz=64`;
        } catch (error) {
            return null;
        }
    };

    const updateEmptyState = () => {
        const hasLinks = personalLinks.length > 0;
        emptyState.classList.toggle('hidden', hasLinks);
        listElement.classList.toggle('hidden', !hasLinks);
    };

    const renderLinks = () => {
        listElement.innerHTML = '';

        personalLinks.forEach((link) => {
            const item = document.createElement('div');
            item.className = 'group flex items-center justify-between gap-3 rounded-xl border border-transparent bg-white/70 dark:bg-slate-900/40 px-3 py-2 shadow-sm transition-colors hover:border-blue-200 dark:hover:border-blue-500 hover:bg-blue-50/60 dark:hover:bg-slate-800/80';
            item.dataset.linkId = link.id;

            const content = document.createElement('div');
            content.className = 'flex min-w-0 flex-1 items-center gap-3';

            const iconWrapper = document.createElement('span');
            iconWrapper.className = 'flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-slate-800/80 dark:text-slate-500 flex-shrink-0';
            iconWrapper.setAttribute('aria-hidden', 'true');

            const icon = document.createElement('img');
            icon.className = 'h-5 w-5 rounded-sm object-contain';
            icon.alt = '';
            icon.loading = 'lazy';
            icon.decoding = 'async';
            icon.referrerPolicy = 'no-referrer';
            icon.src = getFaviconUrl(link.url) || FALLBACK_FAVICON;
            icon.addEventListener('error', () => {
                icon.src = FALLBACK_FAVICON;
                icon.onerror = null;
            });

            iconWrapper.appendChild(icon);

            const anchor = document.createElement('a');
            anchor.href = link.url;
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
            anchor.className = 'flex-1 min-w-0 truncate text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300';
            anchor.textContent = link.label || link.url;
            anchor.title = link.url;

            content.appendChild(iconWrapper);
            content.appendChild(anchor);

            const actions = document.createElement('div');
            actions.className = 'flex shrink-0 items-center gap-1';

            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'rounded-full p-1 text-slate-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors';
            deleteButton.innerHTML = '<span class="sr-only">Hapus link</span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4"><path fill-rule="evenodd" d="M8.75 3a1 1 0 00-.964.737L7.49 4.5H5a.75.75 0 000 1.5h.306l.548 8.645A2 2 0 007.85 16h4.3a2 2 0 001.996-1.355L14.694 6H15a.75.75 0 000-1.5h-2.49l-.295-.763A1 1 0 0011.25 3h-2.5zm-1.22 3.5a.75.75 0 011.5 0l-.25 6.5a.75.75 0 11-1.5 0l.25-6.5zm4.69 0a.75.75 0 00-1.5 0l.25 6.5a.75.75 0 001.5 0l-.25-6.5z" clip-rule="evenodd" /></svg>';
            deleteButton.addEventListener('click', () => {
                personalLinks = personalLinks.filter((current) => current.id !== link.id);
                persistLinks();
                renderLinks();
            });

            actions.appendChild(deleteButton);

            item.appendChild(content);
            item.appendChild(actions);
            listElement.appendChild(item);
        });

        updateEmptyState();
    };

    const showForm = () => {
        formVisible = true;
        form.classList.remove('hidden');
        form.setAttribute('aria-hidden', 'false');
        trigger.setAttribute('aria-expanded', 'true');
        labelInput.focus();
    };

    const hideForm = ({ focusTrigger = false } = {}) => {
        formVisible = false;
        form.classList.add('hidden');
        form.setAttribute('aria-hidden', 'true');
        trigger.setAttribute('aria-expanded', 'false');
        form.reset();
        urlInput.setCustomValidity('');
        if (focusTrigger) {
            trigger.focus();
        }
    };

    trigger.addEventListener('click', () => {
        if (formVisible) {
            hideForm();
        } else {
            showForm();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && formVisible) {
            hideForm({ focusTrigger: true });
        }
    });

    cancelButton.addEventListener('click', () => {
        hideForm({ focusTrigger: true });
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const label = labelInput.value.trim();
        let url = urlInput.value.trim();

        if (!url) {
            urlInput.focus();
            urlInput.reportValidity();
            return;
        }

        if (!/^https?:\/\//i.test(url)) {
            url = `https://${url}`;
        }

        try {
            const parsed = new URL(url);
            url = parsed.toString();
        } catch (error) {
            urlInput.setCustomValidity('Mohon masukkan URL yang valid.');
            urlInput.reportValidity();
            return;
        }

        urlInput.setCustomValidity('');

        const newLink = {
            id: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
                ? crypto.randomUUID()
                : `link-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
            label: label || url,
            url
        };

        personalLinks.push(newLink);
        persistLinks();
        renderLinks();
        hideForm({ focusTrigger: true });
    });

    window.addEventListener('storage', (event) => {
        if (event.key !== PERSONAL_LINKS_KEY) return;
        try {
            personalLinks = event.newValue ? normalizeLinks(JSON.parse(event.newValue)) : [];
            renderLinks();
            if (formVisible) {
                hideForm();
            }
        } catch (error) {
            console.error('Gagal memperbarui link pribadi dari tab lain:', error);
        }
    });

    if (!storageAvailable) {
        trigger.disabled = true;
        trigger.classList.add('opacity-60', 'cursor-not-allowed');
        trigger.setAttribute('aria-disabled', 'true');
        emptyState.textContent = 'Penyimpanan lokal tidak tersedia di browser ini.';
    }

    loadLinks();
    renderLinks();
}


document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const storedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = storedTheme || (systemPrefersDark ? 'dark' : 'light');

    applyTheme(initialTheme, { persist: false });

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = localStorage.getItem('theme') || initialTheme;
            const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
            applyTheme(nextTheme);
        });
    }

    setupDesktopOnlyGuard();

    loadData();
    courses = courses.map(normalizeCourse);
    selectedCourseIndex = null;
    selectedCategory = null;
    renderCourses();
    initializePersonalLinks();
});

window.addCourse = addCourse;
window.deleteCourse = deleteCourse;
window.updateItem = updateItem;
