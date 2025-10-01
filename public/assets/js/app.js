const MODULES_PER_SKS = 3;
const TUTORIAL_SESSIONS = 8;
const TUTORIAL_TASKS = 3;
const PRAKTIK_TASKS = 3;

const SCHEME_DETAILS = {
    Tuton: { label: 'Tutorial Online', badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200' },
    Tuweb: { label: 'Tutorial Webinar', badgeClass: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-200' },
    TTM: { label: 'Tutorial Tatap Muka', badgeClass: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-200' },
    Berpraktik: { label: 'Berpraktik', badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200' },
    Berpraktikum: { label: 'Berpraktikum', badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200' },
    Praktik: { label: 'Praktik', badgeClass: 'bg-lime-100 text-lime-700 dark:bg-lime-900/50 dark:text-lime-200' },
    Praktikum: { label: 'Praktikum', badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200' },
    'Hanya UAS': { label: 'Hanya UAS', badgeClass: 'bg-slate-200 text-slate-700 dark:bg-slate-700/70 dark:text-slate-200' }
};

let courses = [];
let selectedCourseIndex = null;
let selectedCategory = null;

function applyTheme(theme, { persist = true } = {}) {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dataset.theme = theme;
    if (persist) {
        localStorage.setItem('theme', theme);
    }
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
    let totalTutorialScore = 0;
    if (['Tuton', 'Tuweb', 'TTM'].includes(course.scheme)) {
        const presensiDone = course.tutorial.presensi.filter(Boolean).length;
        const diskusiDone = course.tutorial.diskusi.filter(Boolean).length;
        const presensiScore = (presensiDone / TUTORIAL_SESSIONS) * 20;
        const diskusiScore = (diskusiDone / TUTORIAL_SESSIONS) * 30;

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
    }

    let totalPraktikScore = 0;
    if (['Berpraktik', 'Berpraktikum', 'Praktik', 'Praktikum'].includes(course.scheme)) {
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
    }

    const uasScore = parseFloat(course.uas.target) || 0;
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
    return {
        finalScore: finalScore.toFixed(2),
        letterGrade: gradeDetails.letter,
        gradePoint: gradeDetails.point,
        nilaiMutu: (sks * gradeDetails.point).toFixed(2)
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
    const course = {
        name: rawCourse.name || '',
        sks: rawCourse.sks || '0',
        scheme: rawCourse.scheme || 'Tuton',
        tutorial: {
            presensi: ensureArray(rawCourse.tutorial?.presensi, TUTORIAL_SESSIONS, false),
            diskusi: ensureArray(rawCourse.tutorial?.diskusi, TUTORIAL_SESSIONS, false),
            tugasStatus: ensureArray(rawCourse.tutorial?.tugasStatus, TUTORIAL_TASKS, false),
            tugasNilai: ensureArray(rawCourse.tutorial?.tugasNilai, TUTORIAL_TASKS, ''),
            catatanDiskusi: ensureArray(rawCourse.tutorial?.catatanDiskusi, TUTORIAL_SESSIONS, '')
        },
        praktik: {
            deskripsi: ensureArray(rawCourse.praktik?.deskripsi, PRAKTIK_TASKS, ''),
            status: ensureArray(rawCourse.praktik?.status, PRAKTIK_TASKS, false),
            nilai: ensureArray(rawCourse.praktik?.nilai, PRAKTIK_TASKS, '')
        },
        uas: {
            jadwal: rawCourse.uas?.jadwal || '',
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
    const visibleIndexes = [];

    courses.forEach((course, index) => {
        if (selectedCategory) {
            if (course.scheme === selectedCategory) {
                visibleIndexes.push(index);
            }
        } else if (selectedCourseIndex !== null && selectedCourseIndex === index) {
            visibleIndexes.push(index);
        }
    });

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

    courses.forEach((course) => {
        const sks = parseInt(course.sks, 10) || 0;
        if (sks > 0) {
            const calculation = calculateFinalScore(course);
            totalSks += sks;
            totalNilaiMutu += parseFloat(calculation.nilaiMutu);
        }
    });

    const ipk = totalSks > 0 ? (totalNilaiMutu / totalSks).toFixed(2) : '0.00';

    totalMkEl.textContent = courses.length;
    totalSksEl.textContent = totalSks;
    totalIpEl.textContent = ipk;
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
    const hasUAS = !['Praktik', 'Praktikum'].includes(course.scheme);

    const calculation = calculateFinalScore(course);
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
                                <th class="p-3">Presensi (20%)</th>
                                <th class="p-3">Diskusi (30%)</th>
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
                                        <input type="checkbox" onchange="updateItem(${index}, 'diskusi', ${i})" ${course.tutorial.diskusi[i] ? 'checked' : ''} class="h-4 w-4 rounded border-slate-300 dark:border-slate-600">
                                    </td>
                                    <td class="p-3">
                                        <input type="text" oninput="updateItem(${index}, 'catatanDiskusi', ${i}, this.value)" value="${course.tutorial.catatanDiskusi?.[i] || ''}" class="w-full px-3 py-2 bg-transparent border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <h5 class="font-semibold mt-6 mb-3">Tugas Wajib (50%)</h5>
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
                                            <input type="number" min="0" max="100" onchange="updateItem(${index}, 'tugasNilai', ${i}, this.value)" value="${course.tutorial.tugasNilai[i]}" class="w-24 px-3 py-2 bg-transparent border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
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

    const uasSection = hasUAS
        ? `
            <div class="mt-6 border-t border-slate-200/60 dark:border-slate-700/60 pt-6">
                <h4 class="text-lg font-semibold mb-3">Persiapan UAS</h4>
                <div class="grid md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label class="text-sm font-medium">Jadwal UAS</label>
                        <input type="text" oninput="updateItem(${index}, 'uasJadwal', null, this.value)" value="${course.uas.jadwal}" placeholder="dd/mm/yyyy hh:mm" class="w-full mt-1 px-3 py-2 bg-transparent border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
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
                <p class="text-sm text-slate-500 dark:text-slate-400">${course.sks} SKS • <span class="inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full text-xs ${detail.badgeClass}">${detail.label}</span></p>
            </div>
            <button onclick="deleteCourse(${index})" class="text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full p-2 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
            </button>
        </div>
        <div class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl">
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
            diskusi: Array(TUTORIAL_SESSIONS).fill(false),
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
                course.tutorial.diskusi[itemIndex] = !course.tutorial.diskusi[itemIndex];
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
            course.uas.jadwal = value;
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

    loadData();
    courses = courses.map(normalizeCourse);
    selectedCourseIndex = null;
    selectedCategory = null;
    renderCourses();
});

window.addCourse = addCourse;
window.deleteCourse = deleteCourse;
window.updateItem = updateItem;
