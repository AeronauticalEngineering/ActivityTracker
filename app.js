
/* =====================================================
   AERO ACTIVITY TRACKER
   app.js - Complete Version
   Google Apps Script + FullCalendar + Dashboard
===================================================== */

const API_URL =
  "https://script.google.com/macros/s/AKfycbwbmnvmRRvGwqW63QQHjqEnx-znrHdO3cQH4gPtY4K7QQNnch2Vq24VPuoY8SwZoJRa/exec";

let calendar = null;
let allEvents = [];
let isLoading = false;

/* =====================================================
   1. INITIALIZE APPLICATION
===================================================== */

document.addEventListener("DOMContentLoaded", function () {
  console.log("Aero Activity Tracker initialized");

  initCalendar();
  fetchActivityData();

  const form = document.getElementById("activityForm");

  if (form && !form.getAttribute("onsubmit")) {
    form.addEventListener("submit", submitForm);
  }
});

/* =====================================================
   2. SWITCH TAB
===================================================== */

function switchTab(tab) {
  const dashboard = document.getElementById("tab-dashboard");
  const form = document.getElementById("tab-form");

  const btnDashboard = document.getElementById("btn-dashboard");
  const btnForm = document.getElementById("btn-form");

  const pageTitle = document.getElementById("page-title");

  if (!dashboard || !form) return;

  if (tab === "dashboard") {
    dashboard.classList.remove("hidden");
    form.classList.add("hidden");

    if (btnDashboard) {
      btnDashboard.className =
        "w-full text-left px-4 py-2.5 rounded-lg bg-blue-800 transition";
    }

    if (btnForm) {
      btnForm.className =
        "w-full text-left px-4 py-2.5 rounded-lg hover:bg-blue-800 transition";
    }

    if (pageTitle) {
      pageTitle.innerText = "Dashboard กิจกรรม";
    }

    if (calendar) {
      setTimeout(function () {
        calendar.render();
        calendar.updateSize();
      }, 150);
    }

  } else {
    dashboard.classList.add("hidden");
    form.classList.remove("hidden");

    if (btnForm) {
      btnForm.className =
        "w-full text-left px-4 py-2.5 rounded-lg bg-blue-800 transition";
    }

    if (btnDashboard) {
      btnDashboard.className =
        "w-full text-left px-4 py-2.5 rounded-lg hover:bg-blue-800 transition";
    }

    if (pageTitle) {
      pageTitle.innerText = "บันทึกข้อมูลกิจกรรม";
    }
  }
}

/* =====================================================
   3. INITIALIZE FULLCALENDAR
===================================================== */

function initCalendar() {
  const calendarEl = document.getElementById("calendar");

  if (!calendarEl) {
    console.error("Calendar element not found");
    return;
  }

  if (typeof FullCalendar === "undefined") {
    console.error("FullCalendar library not loaded");
    return;
  }

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",

    locale: "th",

    firstDay: 0,

    height: "auto",

    expandRows: true,

    displayEventTime: true,

    eventTimeFormat: {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    },

    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,listWeek"
    },

    buttonText: {
      today: "วันนี้",
      month: "เดือน",
      week: "สัปดาห์",
      list: "กำหนดการ"
    },

    events: [],

    eventDisplay: "block",

    dayMaxEvents: true,

    eventClick: function (info) {
      showModal(info.event.extendedProps);
    },

    eventDidMount: function (info) {
      info.el.title = info.event.title;
    }
  });

  calendar.render();

  console.log("FullCalendar initialized");
}

/* =====================================================
   4. NORMALIZE DATE
   รองรับ:
   2026-11-11
   2569-11-11
   11/11/2026
   11/11/2569
   ISO Date
===================================================== */

function normalizeDate(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value instanceof Date && !isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  const str = String(value).trim();

  // yyyy-MM-dd หรือ ISO Date
  let match = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);

  if (match) {
    let year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    if (year > 2400) year -= 543;

    return validateDate(year, month, day);
  }

  // dd/MM/yyyy
  match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    let year = Number(match[3]);

    if (year > 2400) year -= 543;

    return validateDate(year, month, day);
  }

  console.warn("Invalid date:", value);

  return null;
}

/* =====================================================
   5. VALIDATE DATE
===================================================== */

function validateDate(year, month, day) {
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return (
    String(year).padStart(4, "0") +
    "-" +
    String(month).padStart(2, "0") +
    "-" +
    String(day).padStart(2, "0")
  );
}

/* =====================================================
   6. NORMALIZE TIME
   รองรับ:
   09:00
   9:00
   09:00:00
   Google Sheets numeric time
===================================================== */

function normalizeTime(value, fallback = "00:00") {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  const str = String(value).trim();

  // HH:mm หรือ HH:mm:ss
  const match = str.match(/^(\d{1,2}):(\d{2})/);

  if (match) {
    const hour = Number(match[1]);
    const minute = Number(match[2]);

    if (hour < 24 && minute < 60) {
      return (
        String(hour).padStart(2, "0") +
        ":" +
        String(minute).padStart(2, "0")
      );
    }
  }

  // Google Sheets time fraction
  const num = Number(str);

  if (
    str !== "" &&
    Number.isFinite(num) &&
    num >= 0 &&
    num < 1
  ) {
    const totalMinutes = Math.round(num * 1440);

    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;

    return (
      String(hours).padStart(2, "0") +
      ":" +
      String(minutes).padStart(2, "0")
    );
  }

  console.warn("Invalid time:", value);

  return fallback;
}

/* =====================================================
   7. FETCH ACTIVITY DATA
===================================================== */

async function fetchActivityData() {
  if (!API_URL || isLoading) return;

  isLoading = true;

  console.log("Fetching activity data...");

  try {
    const response = await fetch(
      `${API_URL}?action=getData&t=${Date.now()}`,
      {
        method: "GET",
        redirect: "follow",
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error(
        "HTTP Error: " + response.status
      );
    }

    const result = await response.json();

    console.log("API Response:", result);

    if (
      result.status === "success" &&
      Array.isArray(result.data)
    ) {
      allEvents = result.data;

      console.log(
        "Total activities:",
        allEvents.length
      );

      updateCalendarEvents(allEvents);

      calculateWorkload(allEvents);

    } else {
      throw new Error(
        result.message || "Invalid API response"
      );
    }

  } catch (error) {
    console.error(
      "Error fetching activity data:",
      error
    );

    showNotification(
      "ไม่สามารถโหลดข้อมูลกิจกรรมได้ กรุณาตรวจสอบ API",
      "error"
    );

  } finally {
    isLoading = false;
  }
}

/* =====================================================
   8. UPDATE FULLCALENDAR EVENTS
===================================================== */

function updateCalendarEvents(data) {
  if (!calendar) {
    console.error("Calendar not initialized");
    return;
  }

  const events = [];

  data.forEach(function (item, index) {
    const cleanDate = normalizeDate(item.date);

    if (!cleanDate) {
      console.warn(
        "Skipping invalid date:",
        index,
        item
      );
      return;
    }

    const startTime = normalizeTime(
      item.startTime,
      "00:00"
    );

    const endTime = normalizeTime(
      item.endTime,
      "23:59"
    );

    const title =
      item.activityName ||
      item.activity ||
      "ไม่ระบุชื่อกิจกรรม";

    const start = `${cleanDate}T${startTime}:00`;
    const end = `${cleanDate}T${endTime}:00`;

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime())) {
      console.warn(
        "Invalid event start:",
        item
      );
      return;
    }

    const validEnd =
      !isNaN(endDate.getTime()) &&
      endDate > startDate;

    const event = {
      id: String(item.id || index),

      title: title,

      start: start,

      end: validEnd ? end : undefined,

      allDay: false,

      backgroundColor: "#2563eb",

      borderColor: "#1d4ed8",

      textColor: "#ffffff",

      extendedProps: {
        activityName: title,
        department: item.department || "-",
        date: cleanDate,
        time: `${startTime} - ${endTime} น.`,
        participants: item.participants || "-",
        responsible: item.responsible || "-",
        workHours: Number(item.workHours) || 0
      }
    };

    events.push(event);
  });

  calendar.removeAllEvents();

  calendar.addEventSource(events);

  calendar.updateSize();

  console.log(
    "Calendar events loaded:",
    calendar.getEvents().length
  );

  console.table(
    events.map(event => ({
      title: event.title,
      start: event.start,
      end: event.end
    }))
  );
}

/* =====================================================
   9. CALCULATE WORKLOAD
===================================================== */

function calculateWorkload(data) {
  const workloadMap = {};

  data.forEach(function (item) {
    const durationHours =
      Number(item.workHours) || 0;

    const responsibles = String(
      item.responsible || ""
    )
      .split(",")
      .map(person => person.trim());

    responsibles.forEach(function (person) {
      if (person) {
        workloadMap[person] =
          (workloadMap[person] || 0) +
          durationHours;
      }
    });
  });

  const container =
    document.getElementById("workload-summary");

  if (!container) return;

  container.innerHTML = "";

  const people = Object.entries(workloadMap);

  if (people.length === 0) {
    const message = document.createElement("p");
    message.className =
      "text-gray-500 text-sm col-span-3";
    message.textContent = "ยังไม่มีข้อมูลภาระงาน";
    container.appendChild(message);
    return;
  }

  people.sort(function (a, b) {
    return b[1] - a[1];
  });

  people.forEach(function ([person, hours]) {
    const card = document.createElement("div");

    card.className =
      "p-4 bg-blue-50 border border-blue-100 " +
      "rounded-lg flex justify-between items-center shadow-sm";

    const info = document.createElement("div");

    const name = document.createElement("h4");
    name.className = "font-medium text-gray-800";
    name.textContent = person;

    const subtitle = document.createElement("p");
    subtitle.className = "text-xs text-gray-500";
    subtitle.textContent = "ผู้รับผิดชอบกิจกรรม";

    info.appendChild(name);
    info.appendChild(subtitle);

    const summary = document.createElement("div");
    summary.className = "text-right";

    const total = document.createElement("span");
    total.className =
      "text-lg font-bold text-primary";
    total.textContent = hours.toFixed(1);

    const unit = document.createElement("span");
    unit.className =
      "text-xs text-gray-600 block";
    unit.textContent = "ชั่วโมงสะสม";

    summary.appendChild(total);
    summary.appendChild(unit);

    card.appendChild(info);
    card.appendChild(summary);

    container.appendChild(card);
  });
}

/* =====================================================
   10. SHOW EVENT DETAIL MODAL
===================================================== */

function showModal(data) {
  const fields = {
    "modal-title": data.activityName,
    "modal-dept": data.department,
    "modal-date": data.date,
    "modal-time": data.time,
    "modal-participants": data.participants,
    "modal-responsible": data.responsible
  };

  Object.entries(fields).forEach(function ([id, value]) {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = value ?? "-";
    }
  });

  const modal = document.getElementById("eventModal");

  if (modal) {
    modal.classList.remove("hidden");
  }
}

/* =====================================================
   11. CLOSE EVENT MODAL
===================================================== */

function closeModal() {
  const modal = document.getElementById("eventModal");

  if (modal) {
    modal.classList.add("hidden");
  }
}

/* =====================================================
   12. SUCCESS MODAL
===================================================== */

function showSuccessModal() {
  let modal = document.getElementById("successModal");

  if (!modal) {
    modal = document.createElement("div");

    modal.id = "successModal";

    modal.className =
      "fixed inset-0 bg-black/50 flex " +
      "items-center justify-center p-4 z-50";

    modal.innerHTML = `
      <div class="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center space-y-4">

        <div class="w-16 h-16 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl font-bold">
          ✓
        </div>

        <h3 class="text-xl font-bold text-gray-800">
          บันทึกข้อมูลสำเร็จ!
        </h3>

        <p class="text-sm text-gray-500">
          ระบบได้บันทึกข้อมูลกิจกรรมเรียบร้อยแล้ว
        </p>

        <button
          onclick="closeSuccessModal()"
          class="w-full py-2.5 bg-blue-800 text-white rounded-xl font-medium hover:bg-blue-900 transition shadow-md"
        >
          ตกลง
        </button>

      </div>
    `;

    document.body.appendChild(modal);
  }

  modal.classList.remove("hidden");
}

/* =====================================================
   13. CLOSE SUCCESS MODAL
===================================================== */

async function closeSuccessModal() {
  const modal = document.getElementById("successModal");

  if (modal) {
    modal.classList.add("hidden");
  }

  switchTab("dashboard");

  await fetchActivityData();
}

/* =====================================================
   14. NOTIFICATION
===================================================== */

function showNotification(message, type = "info") {
  const existing = document.getElementById(
    "app-notification"
  );

  if (existing) {
    existing.remove();
  }

  const notification = document.createElement("div");

  notification.id = "app-notification";

  const background =
    type === "error"
      ? "bg-red-600"
      : type === "success"
      ? "bg-green-600"
      : "bg-blue-600";

  notification.className =
    `fixed top-5 right-5 z-50 ${background} ` +
    "text-white px-5 py-3 rounded-xl shadow-xl " +
    "max-w-sm text-sm";

  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(function () {
    notification.remove();
  }, 5000);
}

/* =====================================================
   15. SUBMIT ACTIVITY FORM
===================================================== */

async function submitForm(e) {
  if (e) {
    e.preventDefault();
  }

  const btn = document.getElementById("submit-btn");

  if (btn && btn.disabled) return;

  if (btn) {
    btn.innerText = "กำลังบันทึก...";
    btn.disabled = true;
  }

  const getValue = function (id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : "";
  };

  const payload = {
    activityName: getValue("activityName"),
    department: getValue("department"),
    date: getValue("date"),
    startTime: getValue("startTime"),
    endTime: getValue("endTime"),
    participants: getValue("participants"),
    responsible: getValue("responsible")
  };

  console.log("Submitting activity:", payload);

  try {
    if (
      !payload.activityName ||
      !payload.date ||
      !payload.startTime ||
      !payload.endTime
    ) {
      throw new Error(
        "กรุณากรอกชื่อกิจกรรม วันที่ และเวลาให้ครบถ้วน"
      );
    }

    const startMinutes =
      Number(payload.startTime.split(":")[0]) * 60 +
      Number(payload.startTime.split(":")[1]);

    const endMinutes =
      Number(payload.endTime.split(":")[0]) * 60 +
      Number(payload.endTime.split(":")[1]);

    if (endMinutes <= startMinutes) {
      throw new Error(
        "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น"
      );
    }

    const response = await fetch(API_URL, {
      method: "POST",

      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },

      body: JSON.stringify(payload),

      redirect: "follow"
    });

    if (!response.ok) {
      throw new Error(
        "HTTP Error: " + response.status
      );
    }

    const result = await response.json();

    console.log("Save result:", result);

    if (result.status !== "success") {
      throw new Error(
        result.message || "บันทึกข้อมูลไม่สำเร็จ"
      );
    }

    const form = document.getElementById("activityForm");

    if (form) {
      form.reset();
    }

    showSuccessModal();

  } catch (error) {
    console.error("Submit error:", error);

    showNotification(
      "ไม่สามารถยืนยันการบันทึกได้: " + error.message,
      "error"
    );

  } finally {
    if (btn) {
      btn.innerText = "บันทึกข้อมูล";
      btn.disabled = false;
    }
  }
}

/* =====================================================
   16. REFRESH DATA
===================================================== */

async function refreshData() {
  await fetchActivityData();

  if (calendar) {
    calendar.updateSize();
  }
}

/* =====================================================
   17. OPTIONAL AUTO REFRESH
   Refresh every 5 minutes
===================================================== */

setInterval(function () {
  if (!document.hidden) {
    fetchActivityData();
  }
}, 300000);

/* =====================================================
   END OF APP.JS
===================================================== */
