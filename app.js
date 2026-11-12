const API_URL = "https://script.google.com/macros/s/AKfycbxrvVbhFYpCR0M-gegs6u1hl-sl51T7fcMLV7CdaOp-Gjzydwr_pyYTx261JAX8i4s0/exec";
let calendar;
let allEvents = [];
let globalUsersList = [];
let globalSupportsList = [];
let currentSelectedEvent = null;

document.addEventListener('DOMContentLoaded', function() {
    initCalendar();
    fetchActivityData();
    loadUsersToDropdown();
    loadSupportsToDropdown();
});

function showLoading(message = "กรุณารอสักครู่...") {
    document.getElementById('loading-text').innerText = message;
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

function switchTab(tab) {
    const tabs = ['dashboard', 'workload', 'form', 'support'];
    tabs.forEach(t => {
        document.getElementById(`tab-${t}`).classList.add('hidden');
        const btn = document.getElementById(`btn-${t}`);
        btn.className = 'w-full text-left px-3.5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-navy-900 transition flex items-center space-x-3 text-xs md:text-sm font-medium';
        const icon = btn.querySelector('i');
        if (icon) icon.classList.remove('text-brandOrange-500');
    });

    document.getElementById(`tab-${tab}`).classList.remove('hidden');
    const activeBtn = document.getElementById(`btn-${tab}`);
    activeBtn.className = 'w-full text-left px-3.5 py-2.5 rounded-xl bg-navy-900 text-white transition flex items-center space-x-3 text-xs md:text-sm font-medium';
    const activeIcon = activeBtn.querySelector('i');
    if (activeIcon) activeIcon.classList.add('text-brandOrange-500');

    if (tab === 'dashboard') {
        document.getElementById('page-title').innerText = 'Dashboard กิจกรรม';
        if (calendar) {
            calendar.updateSize();
            calendar.render();
        }
    } else if (tab === 'workload') {
        document.getElementById('page-title').innerText = 'รายงานภาระงาน (ชั่วโมงสะสม)';
        calculateWorkload(allEvents);
    } else if (tab === 'form') {
        document.getElementById('page-title').innerText = 'บันทึกผู้รับผิดชอบใหม่';
        loadUsersToDropdown();
    } else if (tab === 'support') {
        document.getElementById('page-title').innerText = 'บันทึกห้องปฏิบัติการใหม่';
        loadSupportsToDropdown();
    }

    if (window.innerWidth < 768) {
        toggleMobileMenu();
    }
}

async function loadUsersToDropdown() {
    if (!API_URL) return;
    try {
        let response = await fetch(`${API_URL}?action=getUsers&_=${new Date().getTime()}`);
        let result = await response.json();
        if (result.status === "success" && Array.isArray(result.data)) {
            globalUsersList = result.data;
            let selects = document.querySelectorAll('.responsible-select');
            selects.forEach(select => {
                let currentValue = select.value;
                select.innerHTML = '<option value="">-- เลือกผู้รับผิดชอบ --</option>';
                globalUsersList.forEach(name => {
                    let opt = document.createElement('option');
                    opt.value = name;
                    opt.textContent = name;
                    select.appendChild(opt);
                });
                select.value = currentValue;
            });

            let tbody = document.getElementById('existing-users-table');
            if (tbody) {
                tbody.innerHTML = '';
                if (globalUsersList.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="2" class="p-4 text-center text-slate-400">ยังไม่มีรายชื่อผู้รับผิดชอบ</td></tr>`;
                } else {
                    globalUsersList.forEach((name, index) => {
                        tbody.innerHTML += `
                            <tr class="hover:bg-slate-50">
                                <td class="p-3 w-16 text-slate-500">${index + 1}</td>
                                <td class="p-3 font-medium text-navy-900">${name}</td>
                            </tr>
                        `;
                    });
                }
            }
        }
    } catch (error) {
        console.error("Error loading users:", error);
    }
}

async function loadSupportsToDropdown() {
    if (!API_URL) return;
    try {
        let response = await fetch(`${API_URL}?action=getSupports&_=${new Date().getTime()}`);
        let result = await response.json();
        if (result.status === "success" && Array.isArray(result.data)) {
            globalSupportsList = result.data;
            let selects = document.querySelectorAll('.support-select');
            selects.forEach(select => {
                let currentValue = select.value;
                select.innerHTML = '<option value="">-- เลือกห้องปฏิบัติการ / สิ่งสนับสนุน --</option>';
                globalSupportsList.forEach(name => {
                    let opt = document.createElement('option');
                    opt.value = name;
                    opt.textContent = name;
                    select.appendChild(opt);
                });
                select.value = currentValue;
            });

            let tbody = document.getElementById('existing-supports-table');
            if (tbody) {
                tbody.innerHTML = '';
                if (globalSupportsList.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="2" class="p-4 text-center text-slate-400">ยังไม่มีรายการสิ่งสนับสนุน</td></tr>`;
                } else {
                    globalSupportsList.forEach((name, index) => {
                        tbody.innerHTML += `
                            <tr class="hover:bg-slate-50">
                                <td class="p-3 w-16 text-slate-500">${index + 1}</td>
                                <td class="p-3 font-medium text-navy-900">${name}</td>
                            </tr>
                        `;
                    });
                }
            }
        }
    } catch (error) {
        console.error("Error loading supports:", error);
    }
}

function addResponsibleField() {
    let container = document.getElementById('responsible-container');
    let div = document.createElement('div');
    div.className = "flex items-center space-x-2 w-full";
    
    let select = document.createElement('select');
    select.name = "responsible";
    select.className = "responsible-select w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-navy-900 focus:outline-none bg-white text-sm";
    select.required = true;
    
    select.innerHTML = '<option value="">-- เลือกผู้รับผิดชอบ --</option>';
    globalUsersList.forEach(name => {
        let opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
    });
    
    let removeBtn = document.createElement('button');
    removeBtn.type = "button";
    removeBtn.className = "px-3 py-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition text-sm shrink-0";
    removeBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    removeBtn.onclick = function() {
        if (container.children.length > 1) {
            container.removeChild(div);
        } else {
            alert("ต้องมีผู้รับผิดชอบอย่างน้อย 1 คน");
        }
    };
    
    div.appendChild(select);
    div.appendChild(removeBtn);
    container.appendChild(div);
}

function addSupportField() {
    let container = document.getElementById('support-container');
    let div = document.createElement('div');
    div.className = "flex items-center space-x-2 w-full";
    
    let select = document.createElement('select');
    select.name = "support";
    select.className = "support-select w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-navy-900 focus:outline-none bg-white text-sm";
    
    select.innerHTML = '<option value="">-- เลือกห้องปฏิบัติการ / สิ่งสนับสนุน --</option>';
    globalSupportsList.forEach(name => {
        let opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
    });
    
    let removeBtn = document.createElement('button');
    removeBtn.type = "button";
    removeBtn.className = "px-3 py-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition text-sm shrink-0";
    removeBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    removeBtn.onclick = function() {
        container.removeChild(div);
    };
    
    div.appendChild(select);
    div.appendChild(removeBtn);
    container.appendChild(div);
}

async function submitUserForm(e) {
    e.preventDefault();
    let btn = document.getElementById('user-submit-btn');
    btn.innerText = "กำลังบันทึก...";
    btn.disabled = true;
    showLoading("กรุณารอสักครู่...");

    let payload = {
        type: "addUser",
        displayName: document.getElementById('newDisplayName').value
    };

    try {
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
        });

        document.getElementById('userForm').reset();
        hideLoading();
        showSuccessModal();
        loadUsersToDropdown();
    } catch (error) {
        console.error("Error saving user:", error);
        hideLoading();
        alert("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
        btn.innerText = "บันทึกผู้รับผิดชอบ";
        btn.disabled = false;
    }
}

async function submitSupportForm(e) {
    e.preventDefault();
    let btn = document.getElementById('support-submit-btn');
    btn.innerText = "กำลังบันทึก...";
    btn.disabled = true;
    showLoading("กรุณารอสักครู่...");

    let payload = {
        type: "addSupport",
        supportName: document.getElementById('newSupportName').value
    };

    try {
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
        });

        document.getElementById('supportForm').reset();
        hideLoading();
        showSuccessModal();
        loadSupportsToDropdown();
    } catch (error) {
        console.error("Error saving support:", error);
        hideLoading();
        alert("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
        btn.innerText = "บันทึกสิ่งสนับสนุน";
        btn.disabled = false;
    }
}

function initCalendar() {
    var calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'th',
        displayEventTime: false,
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listMonth'
        },
        buttonText: {
            today: 'วันนี้',
            month: 'ตารางเดือน',
            week: 'สัปดาห์',
            list: 'กำหนดการทั้งเดือน'
        },
        views: {
            listMonth: {
                buttonText: 'กำหนดการทั้งเดือน'
            }
        },
        datesSet: function(info) {
            updateMonthlyTable(allEvents, info.view.currentStart);
        },
        events: [],
        eventClick: function(info) {
            showModal(info.event.extendedProps);
        }
    });
    
    calendar.render();
}

async function fetchActivityData() {
    if (!API_URL) return;
    showLoading("กรุณารอสักครู่...");
    try {
        let response = await fetch(`${API_URL}?action=getData&_=${new Date().getTime()}`, {
            method: 'GET',
            redirect: 'follow'
        });
        let result = await response.json();
        if (result.status === "success" && Array.isArray(result.data)) {
            allEvents = result.data;
            updateCalendarEvents(allEvents);
            calculateWorkload(allEvents);
            if (calendar) {
                updateMonthlyTable(allEvents, calendar.getDate());
            }
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    } finally {
        hideLoading();
    }
}

function updateCalendarEvents(data) {
    if (!calendar) return;
    
    let events = data.map(item => {
        let cleanDate = String(item.date || '').split('T')[0].trim();
        let sTime = item.startTime ? String(item.startTime).trim().substring(0, 5) : "00:00";
        let eTime = item.endTime ? String(item.endTime).trim().substring(0, 5) : "23:59";
        
        if (!cleanDate) return null;

        let endDate = cleanDate;
        if (eTime < sTime) {
            let d = new Date(cleanDate);
            d.setDate(d.getDate() + 1);
            endDate = d.toISOString().split('T')[0];
        }
        
        return {
            title: item.activityName || "ไม่มีชื่อกิจกรรม",
            start: `${cleanDate}T${sTime}`,
            end: `${endDate}T${eTime}`,
            extendedProps: {
                rowId: item.rowId || item.id,
                activityName: item.activityName,
                department: item.department,
                date: cleanDate,
                startTime: sTime,
                endTime: eTime,
                time: `${sTime} - ${eTime} น.`,
                participants: item.participants,
                responsible: item.responsible,
                supports: item.supports || "-",
                workHours: item.workHours
            }
        };
    }).filter(event => event !== null);
    
    calendar.getEvents().forEach(event => event.remove());
    events.forEach(event => calendar.addEvent(event));
}

function updateMonthlyTable(data, currentDate) {
    let year = currentDate.getFullYear();
    let month = currentDate.getMonth();

    const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    document.getElementById('current-month-label').innerText = `ประจำเดือน ${thaiMonths[month]} ${year + 543}`;

    let filtered = data.filter(item => {
        if (!item.date) return false;
        let d = new Date(item.date);
        return d.getFullYear() === year && d.getMonth() === month;
    });

    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

    let tbody = document.getElementById('monthly-activity-table');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400">ยังไม่มีข้อมูลกิจกรรมในเดือนนี้</td></tr>`;
        return;
    }

    filtered.forEach(item => {
        let parts = item.date.split('-');
        let formattedDate = `${parts[2]}/${parts[1]}/${Number(parts[0]) + 543}`;
        let sTime = item.startTime ? String(item.startTime).trim().substring(0, 5) : "00:00";
        let eTime = item.endTime ? String(item.endTime).trim().substring(0, 5) : "23:59";
        let timeStr = `${sTime} - ${eTime} น.`;

        let tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 transition cursor-pointer group";
        tr.onclick = function() { 
            showModal({
                rowId: item.rowId || item.id,
                activityName: item.activityName,
                department: item.department,
                date: item.date,
                startTime: sTime,
                endTime: eTime,
                time: timeStr,
                participants: item.participants,
                responsible: item.responsible,
                supports: item.supports || "-"
            }); 
        };
        
        tr.innerHTML = `
            <td class="p-2.5 md:p-3 font-medium text-navy-900 whitespace-nowrap">${formattedDate}</td>
            <td class="p-2.5 md:p-3 text-slate-500 text-xs whitespace-nowrap">${timeStr}</td>
            <td class="p-2.5 md:p-3 font-semibold text-navy-900 group-hover:text-brandOrange-500 transition">${item.activityName}</td>
            <td class="p-2.5 md:p-3 text-slate-600">${item.department || '-'}</td>
            <td class="p-2.5 md:p-3 text-slate-700 font-medium">${item.responsible || '-'}</td>
            <td class="p-2.5 md:p-3 text-slate-500 text-xs">${item.supports || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

function calculateWorkload(data) {
    let workloadMap = {};
    let totalActivityHoursSum = 0;
    let totalActivities = data.length;

    data.forEach(item => {
        let durationHours = Number(item.workHours) || 0;
        totalActivityHoursSum += durationHours;

        let responsibles = String(item.responsible || '').split(',').map(r => r.trim());
        
        responsibles.forEach(person => {
            if (person) {
                workloadMap[person] = (workloadMap[person] || 0) + durationHours;
            }
        });
    });

    document.getElementById('stat-total-activities').innerText = totalActivities;
    document.getElementById('stat-total-hours').innerText = totalActivityHoursSum.toFixed(1);
    document.getElementById('stat-total-persons').innerText = Object.keys(workloadMap).length;

    let container = document.getElementById('workload-summary');
    if (!container) return;
    container.innerHTML = '';

    if (Object.keys(workloadMap).length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-sm col-span-full py-8 text-center">ยังไม่มีข้อมูลภาระงานในระบบ</p>';
        return;
    }

    for (let [person, hours] of Object.entries(workloadMap)) {
        container.innerHTML += `
            <div class="p-5 bg-slate-50/70 border border-slate-200/80 rounded-2xl flex justify-between items-center hover:border-navy-900/30 transition">
                <div class="flex items-center space-x-3.5">
                    <div class="w-11 h-11 rounded-xl bg-navy-900 text-white flex items-center justify-center font-bold text-base">
                        ${person.charAt(0)}
                    </div>
                    <div>
                        <h4 class="font-bold text-navy-900 text-sm">${person}</h4>
                        <p class="text-xs text-slate-400">ผู้รับผิดชอบกิจกรรม</p>
                    </div>
                </div>
                <div class="text-right">
                    <span class="text-xl font-extrabold text-brandOrange-500">${hours.toFixed(1)}</span>
                    <span class="text-[11px] text-slate-400 block font-medium">ชั่วโมงสะสม</span>
                </div>
            </div>
        `;
    }
}

function showModal(data) {
    currentSelectedEvent = data;
    document.getElementById('modal-title').innerText = data.activityName || "รายละเอียดกิจกรรม";
    document.getElementById('modal-dept').innerText = data.department || "-";
    document.getElementById('modal-date').innerText = data.date || "-";
    let sTime = data.startTime ? data.startTime.substring(0, 5) : "00:00";
    let eTime = data.endTime ? data.endTime.substring(0, 5) : "23:59";
    document.getElementById('modal-time').innerText = `${sTime} - ${eTime} น.`;
    document.getElementById('modal-participants').innerText = data.participants || "0";
    document.getElementById('modal-responsible').innerText = data.responsible || "-";
    document.getElementById('modal-supports').innerText = data.supports || "-";
    document.getElementById('eventModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('eventModal').classList.add('hidden');
}

function openEditActivityModal() {
    if (!currentSelectedEvent) return;
    closeModal();
    
    document.getElementById('editActivityId').value = currentSelectedEvent.rowId || "";
    document.getElementById('modal-form-title').innerText = "แก้ไขข้อมูลกิจกรรม";
    
    document.getElementById('activityName').value = currentSelectedEvent.activityName || "";
    document.getElementById('department').value = currentSelectedEvent.department || "";
    document.getElementById('date').value = currentSelectedEvent.date || "";
    document.getElementById('startTime').value = currentSelectedEvent.startTime || "";
    document.getElementById('endTime').value = currentSelectedEvent.endTime || "";
    document.getElementById('participants').value = currentSelectedEvent.participants || "";

    document.getElementById('activityModal').classList.remove('hidden');
    loadUsersToDropdown();
    loadSupportsToDropdown();
}

async function deleteActivity() {
    if (!currentSelectedEvent || !currentSelectedEvent.rowId) {
        alert("ไม่พบรหัสกิจกรรมที่ต้องการลบ");
        return;
    }

    if (!confirm("คุณต้องการลบกิจกรรมนี้ใช่หรือไม่?")) return;

    showLoading("กรุณารอสักครู่...");

    let payload = {
        type: "deleteActivity",
        rowId: currentSelectedEvent.rowId
    };

    try {
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
        });

        closeModal();

        setTimeout(async () => {
            await fetchActivityData();
            hideLoading();
            showSuccessModal();
        }, 1500);

    } catch (error) {
        console.error("Error deleting activity:", error);
        hideLoading();
        alert("เกิดข้อผิดพลาดในการลบข้อมูล");
    }
}

function showSuccessModal() {
    document.getElementById('successModal').classList.remove('hidden');
}

function closeSuccessModal() {
    document.getElementById('successModal').classList.add('hidden');
    switchTab('dashboard');
    fetchActivityData();
}

async function submitActivityForm(e) {
    e.preventDefault();
    let editId = document.getElementById('editActivityId').value;
    showLoading("กรุณารอสักครู่...");

    let startTime = document.getElementById('startTime').value;
    let endTime = document.getElementById('endTime').value;

    let responsibleSelects = document.querySelectorAll('.responsible-select');
    let responsibleArray = [];
    responsibleSelects.forEach(sel => {
        if (sel.value) responsibleArray.push(sel.value);
    });
    let combinedResponsible = responsibleArray.join(', ');

    let supportSelects = document.querySelectorAll('.support-select');
    let supportArray = [];
    supportSelects.forEach(sel => {
        if (sel.value) supportArray.push(sel.value);
    });
    let combinedSupports = supportArray.join(', ');

    let payload = {
        type: editId ? "editActivity" : "addActivity",
        rowId: editId,
        activityName: document.getElementById('activityName').value,
        department: document.getElementById('department').value,
        date: document.getElementById('date').value,
        startTime: startTime,
        endTime: endTime,
        participants: document.getElementById('participants').value,
        responsible: combinedResponsible,
        supports: combinedSupports
    };

    try {
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
        });

        document.getElementById('activityForm').reset();
        closeAddActivityModal();

        setTimeout(async () => {
            await fetchActivityData();
            hideLoading();
            showSuccessModal();
        }, 1500);

    } catch (error) {
        console.error("Error submitting form:", error);
        hideLoading();
        alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
}
