var SPREADSHEET_ID = "112Zk3_nfQ-_dnoJx7I-MLNkGcKuVmUJMfGDvsQJHlhc";

function getSheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName("Activities");
}

function doGet(e) {
  var action = e ? e.parameter.action : "";
  
  if (action === "getData") {
    var sheet = getSheet();
    var rows = sheet.getDataRange().getValues();
    var data = [];
    
    for (var i = 1; i < rows.length; i++) {
      var row = rows[i];
      if (!row[0]) continue;
      
      var id = String(row[0] || "");
      var activityName = String(row[1] || "");
      var department = String(row[2] || "");
      
      var formattedDate = "";
      if (row[3]) {
        if (row[3] instanceof Date) {
          var d = row[3];
          var year = d.getFullYear();
          var month = ('0' + (d.getMonth() + 1)).slice(-2);
          var day = ('0' + d.getDate()).slice(-2);
          formattedDate = year + '-' + month + '-' + day;
        } else {
          formattedDate = String(row[3]).trim().split("T")[0];
        }
      }

      var startTimeStr = "00:00";
      if (row[4]) {
        if (row[4] instanceof Date) {
          startTimeStr = Utilities.formatDate(row[4], "GMT", "HH:mm");
        } else {
          startTimeStr = String(row[4]).trim().substring(0, 5);
        }
      }

      var endTimeStr = "23:59";
      if (row[5]) {
        if (row[5] instanceof Date) {
          endTimeStr = Utilities.formatDate(row[5], "GMT", "HH:mm");
        } else {
          endTimeStr = String(row[5]).trim().substring(0, 5);
        }
      }

      var participants = String(row[6] || "0");
      var responsible = String(row[7] || "");
      var workHours = Number(row[8]) || 0;

      data.push({
        id: id,
        activityName: activityName,
        department: department,
        date: formattedDate,
        startTime: startTimeStr,
        endTime: endTimeStr,
        participants: participants,
        responsible: responsible,
        workHours: workHours
      });
    }
    
    var output = ContentService.createTextOutput(JSON.stringify({ status: "success", count: data.length, data: data }));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  }
}

function doPost(e) {
  try {
    var sheet = getSheet();
    var data = JSON.parse(e.postData.contents);
    var id = "ACT-" + new Date().getTime();
    
    var startArr = (data.startTime || "00:00").split(':');
    var endArr = (data.endTime || "00:00").split(':');
    var startMins = Number(startArr[0]) * 60 + Number(startArr[1]);
    var endMins = Number(endArr[0]) * 60 + Number(endArr[1]);
    
    if (endMins < startMins) {
      endMins += 24 * 60;
    }
    
    var calcHours = (endMins - startMins) / 60;
    if (calcHours < 0) calcHours = 0;

    sheet.appendRow([
      id,
      data.activityName,
      data.department,
      data.date,
      data.startTime,
      data.endTime,
      data.participants,
      data.responsible,
      calcHours
    ]);
    
    var output = ContentService.createTextOutput(JSON.stringify({ status: "success", id: id }));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  } catch (error) {
    var output = ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  }
}
