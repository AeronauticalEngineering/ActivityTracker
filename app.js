{\rtf1\ansi\ansicpg1252\cocoartf2907
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 const API_URL = "\uc0\u3651 \u3626 \u3656 _Web_App_URL_\u3607 \u3637 \u3656 \u3652 \u3604 \u3657 \u3592 \u3634 \u3585 _Google_Apps_Script_\u3605 \u3619 \u3591 \u3609 \u3637 \u3657 ";\
let calendar;\
let allEvents = [];\
\
document.addEventListener('DOMContentLoaded', function() \{\
    initCalendar();\
    fetchActivityData();\
\});\
\
function switchTab(tab) \{\
    if (tab === 'dashboard') \{\
        document.getElementById('tab-dashboard').classList.remove('hidden');\
        document.getElementById('tab-form').classList.add('hidden');\
        document.getElementById('btn-dashboard').className = 'w-full text-left px-4 py-2.5 rounded-lg bg-blue-800 transition';\
        document.getElementById('btn-form').className = 'w-full text-left px-4 py-2.5 rounded-lg hover:bg-blue-800 transition';\
        document.getElementById('page-title').innerText = 'Dashboard \uc0\u3585 \u3636 \u3592 \u3585 \u3619 \u3619 \u3617 ';\
        if(calendar) calendar.render();\
    \} else \{\
        document.getElementById('tab-dashboard').classList.add('hidden');\
        document.getElementById('tab-form').classList.remove('hidden');\
        document.getElementById('btn-form').className = 'w-full text-left px-4 py-2.5 rounded-lg bg-blue-800 transition';\
        document.getElementById('btn-dashboard').className = 'w-full text-left px-4 py-2.5 rounded-lg hover:bg-blue-800 transition';\
        document.getElementById('page-title').innerText = '\uc0\u3610 \u3633 \u3609 \u3607 \u3638 \u3585 \u3586 \u3657 \u3629 \u3617 \u3641 \u3621 \u3585 \u3636 \u3592 \u3585 \u3619 \u3619 \u3617 ';\
    \}\
\}\
\
function initCalendar() \{\
    var calendarEl = document.getElementById('calendar');\
    calendar = new FullCalendar.Calendar(calendarEl, \{\
        initialView: 'dayGridMonth',\
        locale: 'th',\
        headerToolbar: \{\
            left: 'prev,next today',\
            center: 'title',\
            right: 'dayGridMonth,timeGridWeek'\
        \},\
        events: [],\
        eventClick: function(info) \{\
            showModal(info.event.extendedProps);\
        \}\
    \});\
    calendar.render();\
\}\
\
async function fetchActivityData() \{\
    try \{\
        let response = await fetch(`$\{API_URL\}?action=getData`);\
        let result = await response.json();\
        if (result.status === "success") \{\
            allEvents = result.data;\
            updateCalendarEvents(allEvents);\
            calculateWorkload(allEvents);\
        \}\
    \} catch (error) \{\
        console.error("Error fetching data:", error);\
    \}\
\}\
\
function updateCalendarEvents(data) \{\
    let events = data.map(item => \{\
        return \{\
            title: item.activityName,\
            start: `$\{item.date\}T$\{item.startTime\}`,\
            end: `$\{item.date\}T$\{item.endTime\}`,\
            extendedProps: \{\
                activityName: item.activityName,\
                department: item.department,\
                date: item.date,\
                time: `$\{item.startTime\} - $\{item.endTime\} \uc0\u3609 .`,\
                participants: item.participants,\
                responsible: item.responsible\
            \}\
        \};\
    \});\
    calendar.removeAllEvents();\
    calendar.addEventSource(events);\
\}\
\
function calculateWorkload(data) \{\
    let workloadMap = \{\};\
\
    data.forEach(item => \{\
        let startTime = new Date(`1970-01-01T$\{item.startTime\}:00`);\
        let endTime = new Date(`1970-01-01T$\{item.endTime\}:00`);\
        let durationHours = (endTime - startTime) / (1000 * 60 * 60);\
        if (durationHours < 0) durationHours = 0;\
\
        let responsibles = item.responsible.split(',').map(r => r.trim());\
        let count = responsibles.length;\
        let hoursPerPerson = count > 0 ? durationHours / count : durationHours;\
\
        responsibles.forEach(person => \{\
            if (person) \{\
                workloadMap[person] = (workloadMap[person] || 0) + hoursPerPerson;\
            \}\
        \});\
    \});\
\
    let container = document.getElementById('workload-summary');\
    container.innerHTML = '';\
\
    if (Object.keys(workloadMap).length === 0) \{\
        container.innerHTML = '<p class="text-gray-500 text-sm col-span-3">\uc0\u3618 \u3633 \u3591 \u3652 \u3617 \u3656 \u3617 \u3637 \u3586 \u3657 \u3629 \u3617 \u3641 \u3621 \u3616 \u3634 \u3619 \u3632 \u3591 \u3634 \u3609 </p>';\
        return;\
    \}\
\
    for (let [person, hours] of Object.entries(workloadMap)) \{\
        container.innerHTML += `\
            <div class="p-4 bg-blue-50 border border-blue-100 rounded-lg flex justify-between items-center">\
                <div>\
                    <h4 class="font-medium text-gray-800">$\{person\}</h4>\
                    <p class="text-xs text-gray-500">\uc0\u3612 \u3641 \u3657 \u3619 \u3633 \u3610 \u3612 \u3636 \u3604 \u3594 \u3629 \u3610 \u3585 \u3636 \u3592 \u3585 \u3619 \u3619 \u3617 </p>\
                </div>\
                <div class="text-right">\
                    <span class="text-lg font-bold text-primary">$\{hours.toFixed(1)\}</span>\
                    <span class="text-xs text-gray-600 block">\uc0\u3594 \u3633 \u3656 \u3623 \u3650 \u3617 \u3591 \u3626 \u3632 \u3626 \u3617 </span>\
                </div>\
            </div>\
        `;\
    \}\
\}\
\
function showModal(data) \{\
    document.getElementById('modal-title').innerText = data.activityName;\
    document.getElementById('modal-dept').innerText = data.department;\
    document.getElementById('modal-date').innerText = data.date;\
    document.getElementById('modal-time').innerText = data.time;\
    document.getElementById('modal-participants').innerText = data.participants;\
    document.getElementById('modal-responsible').innerText = data.responsible;\
    document.getElementById('eventModal').classList.remove('hidden');\
\}\
\
function closeModal() \{\
    document.getElementById('eventModal').classList.add('hidden');\
\}\
\
async function submitForm(e) \{\
    e.preventDefault();\
    let btn = document.getElementById('submit-btn');\
    btn.innerText = "\uc0\u3585 \u3635 \u3621 \u3633 \u3591 \u3610 \u3633 \u3609 \u3607 \u3638 \u3585 ...";\
    btn.disabled = true;\
\
    let payload = \{\
        activityName: document.getElementById('activityName').value,\
        department: document.getElementById('department').value,\
        date: document.getElementById('date').value,\
        startTime: document.getElementById('startTime').value,\
        endTime: document.getElementById('endTime').value,\
        participants: document.getElementById('participants').value,\
        responsible: document.getElementById('responsible').value\
    \};\
\
    try \{\
        let response = await fetch(API_URL, \{\
            method: 'POST',\
            body: JSON.stringify(payload)\
        \});\
        let result = await response.json();\
        if (result.status === "success") \{\
            alert("\uc0\u3610 \u3633 \u3609 \u3607 \u3638 \u3585 \u3586 \u3657 \u3629 \u3617 \u3641 \u3621 \u3626 \u3635 \u3648 \u3619 \u3655 \u3592 !");\
            document.getElementById('activityForm').reset();\
            fetchActivityData();\
            switchTab('dashboard');\
        \} else \{\
            alert("\uc0\u3648 \u3585 \u3636 \u3604 \u3586 \u3657 \u3629 \u3612 \u3636 \u3604 \u3614 \u3621 \u3634 \u3604 : " + result.message);\
        \}\
    \} catch (error) \{\
        alert("\uc0\u3652 \u3617 \u3656 \u3626 \u3634 \u3617 \u3634 \u3619 \u3606 \u3648 \u3594 \u3639 \u3656 \u3629 \u3617 \u3605 \u3656 \u3629 \u3648 \u3595 \u3636 \u3619 \u3660 \u3615 \u3648 \u3623 \u3629 \u3619 \u3660 \u3652 \u3604 \u3657 ");\
    \} finally \{\
        btn.innerText = "\uc0\u3610 \u3633 \u3609 \u3607 \u3638 \u3585 \u3586 \u3657 \u3629 \u3617 \u3641 \u3621 ";\
        btn.disabled = false;\
    \}\
\}}