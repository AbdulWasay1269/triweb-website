/**
 * TriWeb Solutions: website enquiries → Google Sheet
 *
 * Every time someone presses "Send message" on the website, this script
 * adds one row to the "Enquiries" tab of this spreadsheet and emails you
 * a copy. It runs on your own Google account, free of charge.
 *
 * Setup steps are in SETUP.txt (next to this file).
 */

// ── Settings you can change ────────────────────────────────────────────
var SHEET_NAME = 'Enquiries'
var TIME_ZONE = 'Asia/Karachi'
var SEND_EMAIL_ALERT = true // false = rows only, no email
// ───────────────────────────────────────────────────────────────────────

var HEADERS = [
  'Reference',
  'Received (Pakistan time)',
  'Name',
  'Email',
  'Business name',
  'Interested in',
  'Project details',
  'Status',
  'Notes',
  'Sent from page',
  'Device / browser',
]
var WIDTHS = [120, 170, 170, 230, 180, 160, 420, 110, 240, 220, 260]
var LIMITS = { name: 120, email: 160, company: 160, interest: 60, message: 5000, page: 300, agent: 300 }

/** Run this once from the editor (Run ▶ setup) to create and format the sheet. */
function setup() {
  var sheet = getSheet_()
  SpreadsheetApp.getActiveSpreadsheet().setSpreadsheetTimeZone(TIME_ZONE)
  return 'Ready: ' + sheet.getName()
}

/** Website form posts here. */
function doPost(e) {
  var lock = LockService.getScriptLock()
  try {
    var data = parse_(e)

    // Spam trap: real visitors never fill the hidden "website" field
    if (data.website) return json_({ ok: true })

    var name = clean_(data.name, LIMITS.name)
    var email = clean_(data.email, LIMITS.email)
    var message = clean_(data.message, LIMITS.message)
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || message.length < 10) {
      return json_({ ok: false, error: 'missing_fields' })
    }

    lock.waitLock(20000)
    // Same submission arriving twice (a retry) is saved only once
    var cache = CacheService.getScriptCache()
    var sid = clean_(data.sid, 64)
    if (sid) {
      var seen = cache.get('sid:' + sid)
      if (seen) {
        lock.releaseLock()
        return json_({ ok: true, ref: seen })
      }
    }
    var sheet = getSheet_()
    var now = new Date()
    var ref = 'TW-' + Utilities.formatDate(now, TIME_ZONE, 'yyMMdd') + '-' + ('000' + sheet.getLastRow()).slice(-3)

    var row = [
      ref,
      now,
      safe_(name),
      safe_(email),
      safe_(clean_(data.company, LIMITS.company)) || '-',
      safe_(clean_(data.interest, LIMITS.interest)) || 'Not sure yet',
      safe_(message),
      'New',
      '',
      safe_(clean_(data.page, LIMITS.page)),
      safe_(clean_(data.agent, LIMITS.agent)),
    ]
    sheet.appendRow(row)
    var r = sheet.getLastRow()
    sheet.getRange(r, 2).setNumberFormat('dd mmm yyyy, h:mm am/pm')
    sheet.getRange(r, 1, 1, HEADERS.length).setVerticalAlignment('top').setWrap(true)
    sheet.getRange(r, 4).setFormula('=HYPERLINK("mailto:' + email.replace(/"/g, '') + '", "' + email.replace(/"/g, '') + '")')
    SpreadsheetApp.flush()
    if (sid) cache.put('sid:' + sid, ref, 21600)
    lock.releaseLock()

    if (SEND_EMAIL_ALERT) notify_(ref, now, name, email, row)
    return json_({ ok: true, ref: ref })
  } catch (err) {
    try { lock.releaseLock() } catch (ignore) {}
    console.error(err)
    return json_({ ok: false, error: 'server_error' })
  }
}

/** Opening the web app link in a browser shows this, handy to check it's live. */
function doGet() {
  return json_({ ok: true, service: 'TriWeb enquiries', sheet: SHEET_NAME })
}

// ── Helpers ────────────────────────────────────────────────────────────

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sheet = ss.getSheetByName(SHEET_NAME)
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME, 0)
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS)
    var head = sheet.getRange(1, 1, 1, HEADERS.length)
    head.setFontWeight('bold').setFontColor('#ffffff').setBackground('#141c2e').setVerticalAlignment('middle').setWrap(true)
    sheet.setRowHeight(1, 36)
    sheet.setFrozenRows(1)
    WIDTHS.forEach(function (w, i) { sheet.setColumnWidth(i + 1, w) })
    // Status dropdown for the whole column
    var rule = SpreadsheetApp.newDataValidation().requireValueInList(['New', 'Contacted', 'In progress', 'Won', 'Closed'], true).setAllowInvalid(false).build()
    sheet.getRange(2, 8, sheet.getMaxRows() - 1, 1).setDataValidation(rule)
    // Highlight new enquiries
    var newRule = SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('New').setBackground('#ffe1d9').setFontColor('#b3260f').setBold(true).setRanges([sheet.getRange('H2:H')]).build()
    sheet.setConditionalFormatRules([newRule])
    sheet.getRange('A:A').setFontWeight('bold')
    sheet.getRange('G:G').setWrap(true)
    try { sheet.getRange(1, 1, sheet.getMaxRows(), HEADERS.length).applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false) } catch (ignore) {}
  }
  return sheet
}

function parse_(e) {
  if (!e) return {}
  if (e.postData && e.postData.contents) {
    try { return JSON.parse(e.postData.contents) } catch (ignore) {}
  }
  return e.parameter || {}
}

function clean_(v, max) {
  return String(v == null ? '' : v).replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max)
}

// Stops text like "=IMPORTXML(...)" from running as a formula in the sheet
function safe_(v) {
  return /^[=+\-@]/.test(v) ? "'" + v : v
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}

function notify_(ref, when, name, email, row) {
  try {
    var to = Session.getEffectiveUser().getEmail()
    if (!to) return
    var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }
    var lines = [
      ['Reference', ref],
      ['Received', Utilities.formatDate(when, TIME_ZONE, 'dd MMM yyyy, h:mm a')],
      ['Name', name],
      ['Email', email],
      ['Business name', row[4]],
      ['Interested in', row[5]],
    ]
    var html =
      '<div style="font-family:Arial,sans-serif;font-size:14px;color:#141c2e">' +
      '<h2 style="margin:0 0 12px">New website enquiry</h2><table cellpadding="6" style="border-collapse:collapse">' +
      lines.map(function (l) { return '<tr><td style="color:#667;vertical-align:top">' + l[0] + '</td><td><b>' + esc(l[1]) + '</b></td></tr>' }).join('') +
      '</table><p style="margin:16px 0 6px;color:#667">Project details</p><div style="white-space:pre-wrap;border-left:3px solid #ff3a20;padding:8px 12px;background:#f6f4f1">' +
      esc(row[6]) + '</div><p style="color:#667;margin-top:16px">Press Reply to answer ' + esc(name) + ' directly.</p></div>'
    MailApp.sendEmail({ to: to, replyTo: email, name: 'TriWeb website', subject: 'New enquiry ' + ref + ': ' + name + ' (' + row[5] + ')', htmlBody: html })
  } catch (err) {
    console.error('Email alert failed', err)
  }
}
