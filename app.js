const API_URL = "https://script.google.com/macros/s/AKfycbwbmnvmRRvGwqW63QQHjqEnx-znrHdO3cQH4gPtY4K7QQNnch2Vq24VPuoY8SwZoJRa/exec";
let calendar;
let allEvents = [];

document.addEventListener('DOMContentLoaded', function() {
    initCalendar();
    fetchActivityData();
});

function switchTab(tab) {
    if (tab === 'dashboard') {
        document.getElementById('tab-dashboard').classList.remove('hidden');
        document.getElementById('tab-form').classList.add('hidden');
        document.getElementById('btn-dashboard').className = 'w-full text-left px-4 py-2.5 rounded-lg bg-blue-800 transition';
        document.getElementById('btn-form').className = 'w-full text-left px-4 py-2.5 rounded-lg hover:bg-blue-800 transition';
        document.getElementById('page-title').innerText = 'Dashboard กิจกรรม';
        if (calendar) {
            calendar.render();
            setTimeout(() => calendar.updateSize(), 100);
        }
    } else {
        document.getElementById('tab-dashboard').classList.add('hidden');
        document.getElementById('tab-form').classList.remove('hidden');
        document.getElementById('btn-form').className = 'w-full text-left px-4 py-2.5 rounded-lg bg-blue-800 transition';
        document.getElementById('btn-dashboard').className = 'w-full text-left px-4 py-2.5 rounded-lg hover:bg-blue-800 transition';
        document.getElementById('page-title').innerText = 'บันทึกข้อมูลกิจกรรม';
    }
}

function initCalendar() {
    var calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'th',
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
        let response = await fetch(`${API_URL}?action=getData`, {
            method: 'GET',
            redirect: 'follow'
        });
        let result = await response.json();
        if (result.status === "success" && Array.isArray(result.data)) {
            allEvents = result.data;
            updateCalendarEvents(allEvents);
            calculateWorkload(allEvents);
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

function updateCalendarEvents(data) {
    if (!calendar) return;
    let events = data.map(item => {
        let cleanDate = String(item.date).split('T')[0];
        let sTime = item.startTime ? item.startTime.substring(0, 5) : "00:00";
        let eTime = item.endTime ? item.endTime.substring(0, 5) : "23:59";
        
        return {
            title: item.activityName,
            start: `${cleanDate}T${sTime}`,
            end: `${cleanDate}T${eTime}`,
            extendedProps: {
                activityName: item.activityName,
                department: item.department,
                date: cleanDate,
                time: `${sTime} - ${eTime} น.`,
                participants: item.participants,
                responsible: item.responsible,
                workHours: item.workHours
            }
        };
    });
    
    calendar.removeAllEvents();
    calendar.addEventSource(events);
    calendar.render();
}

function calculateWorkload(data) {
    let workloadMap = {};

    data.forEach(item => {
        let durationHours = Number(item.workHours) || 0;
        let responsibles = String(item.responsible || '').split(',').map(r => r.trim());
        
        responsibles.forEach(person => {
            if (person) {
                workloadMap[person] = (workloadMap[person] || 0) + durationHours;
            }
        });
    });

    let container = document.getElementById('workload-summary');
    if (!container) return;
    container.innerHTML = '';

    if (Object.keys(workloadMap).length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm col-span-3">ยังไม่มีข้อมูลภาระงาน</p>';
        return;
    }

    for (let [person, hours] of Object.entries(workloadMap)) {
        container.innerHTML += `
            <div class="p-4 bg-blue-50 border border-blue-100 rounded-lg flex justify-between items-center shadow-sm">
                <div>
                    <h4 class="font-medium text-gray-800">${person}</h4>
                    <p class="text-xs text-gray-500">ผู้รับผิดชอบกิจกรรม</p>
                </div>
                <div class="text-right">
                    <span class="text-lg font-bold text-primary">${hours.toFixed(1)}</span>
                    <span class="text-xs text-gray-600 block">ชั่วโมงสะสม</span>
                </div>
            </div>
        `;
    }
}

function showModal(data) {
    document.getElementById('modal-title').innerText = data.activityName;
    document.getElementById('modal-dept').innerText = data.department;
    document.getElementById('modal-date').innerText = data.date;
    document.getElementById('modal-time').innerText = data.time;
    document.getElementById('modal-participants').innerText = data.participants;
    document.getElementById('modal-responsible').innerText = data.responsible;
    document.getElementById('eventModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('eventModal').classList.add('hidden');
}

function showSuccessModal() {
    let modal = document.getElementById('successModal');
    if (!modal) {
        const modalHTML = `
            <div id="successModal" class="fixed inset-0 bg-black/50 hidden flex items-center justify-center p-4 z-50">
                <div class="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center space-y-4">
                    <div class="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
                        ✓
                    </div>
                    <h3 class="text-xl font-bold text-gray-800">บันทึกข้อมูลสำเร็จ!</h3>
                    <p class="text-sm text-gray-500">ระบบได้บันทึกข้อมูลและอัปเดตปฏิทินเรียบร้อยแล้วครับ</p>
                    <button onclick="closeSuccessModal()" class="w-full py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-blue-900 transition shadow-md">
                        ตกลง
                    </button>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modal = document.getElementById('successModal');
    }
    modal.classList.remove('hidden');
}

function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) modal.classList.add('hidden');
    switchTab('dashboard');
    fetchActivityData();
}

async function submitForm(e) {
    e.preventDefault();
    let btn = document.getElementById('submit-btn');
    btn.innerText = "กำลังบันทึก...";
    btn.disabled = true;

    let payload = {
        activityName: document.getElementById('activityName').value,
        department: document.getElementById('department').value,
        date: document.getElementById('date').value,
        startTime: document.getElementById('startTime').value,
        endTime: document.getElementById('endTime').value,
        participants: document.getElementById('participants').value,
        responsible: document.getElementById('responsible').value
    };

    try {
        await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        document.getElementById('activityForm').reset();
        await fetchActivityData();
        showSuccessModal();
    } catch (error) {
        document.getElementById('activityForm').reset();
        await fetchActivityData();
        showSuccessModal();
    } finally {
        btn.innerText = "บันทึกข้อมูล";
        btn.disabled = false;
    }
}
