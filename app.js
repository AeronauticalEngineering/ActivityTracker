const API_URL = "https://script.google.com/macros/s/AKfycbxrvVbhFYpCR0M-gegs6u1hl-sl51T7fcMLV7CdaOp-Gjzydwr_pyYTx261JAX8i4s0/exec";
let calendar;
let allEvents = [];
let globalUsersList = [];
let globalSupportsList = [];

document.addEventListener('DOMContentLoaded', function() {
    initCalendar();
    fetchActivityData();
    loadUsersToDropdown();
    loadSupportsToDropdown();
});

function switchTab(tab) {
    document.getElementById('tab-dashboard').classList.add('hidden');
    document.getElementById('tab-workload').classList.add('hidden');
    document.getElementById('tab-form').classList.add('hidden');
    document.getElementById('tab-support').classList.add('hidden');
    
    document.getElementById('btn-dashboard').className = 'w-full text-left px-4 py-3 rounded-xl hover:bg-blue-800 transition flex items-center space-x-3 text-sm font-medium';
    document.getElementById('btn-workload').className = 'w-full text-left px-4 py-3 rounded-xl hover:bg-blue-800 transition flex items-center space-x-3 text-sm font-medium';
    document.getElementById('btn-form').className = 'w-full text-left px-4 py-3 rounded-xl hover:bg-blue-800 transition flex items-center space-x-3 text-sm font-medium';
    document.getElementById('btn-support').className = 'w-full text-left px-4 py-3 rounded-xl hover:bg-blue-800 transition flex items-center space-x-3 text-sm font-medium';

    if (tab === 'dashboard') {
        document.getElementById('tab-dashboard').classList.remove('hidden');
        document.getElementById('btn-dashboard').className = 'w-full text-left px-4 py-3 rounded-xl bg-blue-800 transition flex items-center space-x-3 shadow-inner text-sm font-medium';
        document.getElementById('page-title').innerText = 'Dashboard กิจกรรม';
        if (calendar) {
            calendar.updateSize();
            calendar.render();
        }
    } else if (tab === 'workload') {
        document.getElementById('tab-workload').classList.remove('hidden');
        document.getElementById('btn-workload').className = 'w-full text-left px-4 py-3 rounded-xl bg-blue-800 transition flex items-center space-x-3 shadow-inner text-sm font-medium';
        document.getElementById('page-title').innerText = 'รายงานภาระงาน (ชั่วโมงสะสม)';
        calculateWorkload(allEvents);
    } else if (tab === 'form') {
        document.getElementById('tab-form').classList.remove('hidden');
        document.getElementById('btn-form').className = 'w-full text-left px-4 py-3 rounded-xl bg-blue-800 transition flex items-center space-x-3 shadow-inner text-sm font-medium';
        document.getElementById('page-title').innerText = 'บันทึกผู้รับผิดชอบใหม่';
    } else if (tab === 'support') {
        document.getElementById('tab-support').classList.remove('hidden');
        document.getElementById('btn-support').className = 'w-full text-left px-4 py-3 rounded-xl bg-blue-800 transition flex items-center space-x-3 shadow-inner text-sm font-medium';
        document.getElementById('page-title').innerText = 'บันทึกสิ่งสนับสนุนใหม่';
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
                select.innerHTML = '<option value="">-- เลือกสิ่งสนับสนุน --</option>';
                globalSupportsList.forEach(name => {
                    let opt = document.createElement('option');
                    opt.value = name;
                    opt.textContent = name;
                    select.appendChild(opt);
                });
                select.value = currentValue;
            });
        }
    } catch (error) {
        console.error("Error loading supports:", error);
    }
}

function addResponsibleField() {
    let container = document.getElementById('responsible-container');
    let div = document.createElement('div');
    div.className = "flex items-center space-x-2";
    
    let select = document.createElement('select');
    select.name = "responsible";
    select.className = "responsible-select w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:outline-none bg-white text-sm";
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
    removeBtn.className = "px-3 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition text-sm";
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
    div.className = "flex items-center space-x-2";
    
    let select = document.createElement('select');
    select.name = "support";
    select.className = "support-select w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:outline-none bg-white text-sm";
    
    select.innerHTML = '<option value="">-- เลือกสิ่งสนับสนุน --</option>';
    globalSupportsList.forEach(name => {
        let opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
    });
    
    let removeBtn = document.createElement('button');
    removeBtn.type = "button";
    removeBtn.className = "px-3 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition text-sm";
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
        showSuccessModal();
        loadUsersToDropdown();
    } catch (error) {
        console.error("Error saving user:", error);
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
        showSuccessModal();
        loadSupportsToDropdown();
    } catch (error) {
        console.error("Error saving support:", error);
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
            right: 'dayGridMonth,timeGridWeek,listWeek'
        },
        buttonText: {
            today: 'วันนี้',
            month: 'เดือน',
            week: 'สัปดาห์',
            list: 'กำหนดการ'
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
            backgroundColor: '#1d4ed8',
            borderColor: '#1e40af',
            extendedProps: {
                activityName: item.activityName,
                department: item.department,
                date: cleanDate,
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
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-gray-400">ยังไม่มีข้อมูลกิจกรรมในเดือนนี้</td></tr>`;
        return;
    }

    filtered.forEach(item => {
        let parts = item.date.split('-');
        let formattedDate = `${parts[2]}/${parts[1]}/${Number(parts[0]) + 543}`;
        let timeStr = `${item.startTime} - ${item.endTime} น.`;

        let tr = document.createElement('tr');
        tr.className = "hover:bg-blue-50/60 transition cursor-pointer";
        tr.onclick = function() { showModal(item); };
        
        tr.innerHTML = `
            <td class="p-3 font-medium text-gray-800">${formattedDate}</td>
            <td class="p-3 text-gray-600 text-xs">${timeStr}</td>
            <td class="p-3 font-semibold text-primary">${item.activityName}</td>
            <td class="p-3 text-gray-600">${item.department || '-'}</td>
            <td class="p-3 text-gray-700 font-medium">${item.responsible || '-'}</td>
            <td class="p-3 text-gray-600 text-xs">${item.supports || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

function calculateWorkload(data) {
    let workloadMap = {};
    let totalActivityHoursSum = 0; // ชั่วโมงรวมของกิจกรรมทั้งหมดในระบบ
    let totalActivities = data.length;

    data.forEach(item => {
        let durationHours = Number(item.workHours) || 0;
        totalActivityHoursSum += durationHours; // รวม workHours ของทุกกิจกรรมตรงๆ

        let responsibles = String(item.responsible || '').split(',').map(r => r.trim());
        
        responsibles.forEach(person => {
            if (person) {
                workloadMap[person] = (workloadMap[person] || 0) + durationHours;
            }
        });
    });

    // อัปเดตตัวเลขการ์ดสรุปด้านบน
    document.getElementById('stat-total-activities').innerText = totalActivities;
    document.getElementById('stat-total-hours').innerText = totalActivityHoursSum.toFixed(1);
    document.getElementById('stat-total-persons').innerText = Object.keys(workloadMap).length;

    let container = document.getElementById('workload-summary');
    if (!container) return;
    container.innerHTML = '';

    if (Object.keys(workloadMap).length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm col-span-full py-8 text-center">ยังไม่มีข้อมูลภาระงานในระบบ</p>';
        return;
    }

    for (let [person, hours] of Object.entries(workloadMap)) {
        container.innerHTML += `
            <div class="p-5 bg-white border border-gray-100 rounded-2xl flex justify-between items-center shadow-sm hover:shadow-md transition">
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 rounded-xl bg-blue-50 text-primary flex items-center justify-center font-bold text-lg">
                        ${person.charAt(0)}
                    </div>
                    <div>
                        <h4 class="font-bold text-gray-800 text-base">${person}</h4>
                        <p class="text-xs text-gray-400">ผู้รับผิดชอบกิจกรรม</p>
                    </div>
                </div>
                <div class="text-right">
                    <span class="text-xl font-extrabold text-primary">${hours.toFixed(1)}</span>
                    <span class="text-xs text-gray-500 block font-medium">ชั่วโมงสะสม</span>
                </div>
            </div>
        `;
    }
}

function showModal(data) {
    document.getElementById('modal-title').innerText = data.activityName || "รายละเอียดกิจกรรม";
    document.getElementById('modal-dept').innerText = data.department || "-";
    document.getElementById('modal-date').innerText = data.date || "-";
    document.getElementById('modal-time').innerText = `${data.startTime || '00:00'} - ${data.endTime || '23:59'} น.`;
    document.getElementById('modal-participants').innerText = data.participants || "0";
    document.getElementById('modal-responsible').innerText = data.responsible || "-";
    document.getElementById('modal-supports').innerText = data.supports || "-";
    document.getElementById('eventModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('eventModal').classList.add('hidden');
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
    let btn = document.getElementById('submit-btn');
    btn.innerText = "กำลังบันทึก...";
    btn.disabled = true;

    let startTime = document.getElementById('startTime').value;
    let endTime = document.getElementById('endTime').value;
    
    let startArr = (startTime || "00:00").split(':');
    let endArr = (endTime || "00:00").split(':');
    let startMins = Number(startArr[0]) * 60 + Number(startArr[1]);
    let endMins = Number(endArr[0]) * 60 + Number(endArr[1]);
    
    if (endMins < startMins) {
        endMins += 24 * 60;
    }
    let calcHours = Math.max(0, (endMins - startMins) / 60);

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
        showSuccessModal();

        setTimeout(async () => {
            await fetchActivityData();
        }, 2000);

    } catch (error) {
        console.error("Error submitting form:", error);
        alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
        btn.innerText = "บันทึกกิจกรรม";
        btn.disabled = false;
    }
}
